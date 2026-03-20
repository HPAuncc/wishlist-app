'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WishlistItem, WishlistStore, ComparisonTask, Comparison, BundledItem } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { STARTING_ELO } from '@/lib/elo'
import { RealtimeChannel } from '@supabase/supabase-js'

const EMPTY_STORE: WishlistStore = {
  items: [],
  comparisons: [],
  comparisonQueue: [],
  lastUpdated: Date.now(),
}

// Convert DB row → app type
function rowToItem(row: Record<string, unknown>): WishlistItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    price: (row.price as number) ?? undefined,
    imageUrl: (row.image_url as string) ?? undefined,
    productUrl: (row.product_url as string) ?? undefined,
    retailer: (row.retailer as string) ?? undefined,
    addedAt: row.added_at as number,
    eloRating: row.elo_rating as number,
    comparisonCount: row.comparison_count as number,
    bundledItems: (row.bundled_items as BundledItem[]) ?? undefined,
  }
}

function rowToComparison(row: Record<string, unknown>): Comparison {
  return {
    id: row.id as string,
    itemAId: row.item_a_id as string,
    itemBId: row.item_b_id as string,
    winnerId: row.winner_id as string,
    timestamp: row.timestamp as number,
  }
}

function rowToTask(row: Record<string, unknown>): ComparisonTask {
  return {
    itemAId: row.item_a_id as string,
    itemBId: row.item_b_id as string,
    priority: row.priority as number,
    reason: row.reason as 'insertion' | 'calibration' | 'tiebreak',
    insertionState: (row.insertion_state as ComparisonTask['insertionState']) ?? undefined,
  }
}

export function useSupabaseWishlist() {
  const supabase = createClient()
  const [store, setStoreLocal] = useState<WishlistStore>(EMPTY_STORE)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const prevStoreRef = useRef<WishlistStore>(EMPTY_STORE)
  const syncingRef = useRef(false)

  // Load household and initial data
  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!profile?.household_id || cancelled) {
        setHydrated(true)
        return
      }

      setHouseholdId(profile.household_id)
      const hid = profile.household_id

      // Load all data in parallel
      const [itemsRes, compsRes, queueRes] = await Promise.all([
        supabase.from('wishlist_items').select('*').eq('household_id', hid).order('added_at'),
        supabase.from('comparisons').select('*').eq('household_id', hid).order('timestamp'),
        supabase.from('comparison_queue').select('*').eq('household_id', hid).order('position'),
      ])

      if (cancelled) return

      const loaded: WishlistStore = {
        items: (itemsRes.data ?? []).map(rowToItem),
        comparisons: (compsRes.data ?? []).map(rowToComparison),
        comparisonQueue: (queueRes.data ?? []).map(rowToTask),
        lastUpdated: Date.now(),
      }

      setStoreLocal(loaded)
      prevStoreRef.current = loaded
      setHydrated(true)
    }

    init()
    return () => { cancelled = true }
  }, [supabase])

  // Realtime subscription
  useEffect(() => {
    if (!householdId) return

    const channel = supabase
      .channel(`household-${householdId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wishlist_items',
        filter: `household_id=eq.${householdId}`,
      }, () => { if (!syncingRef.current) refetch() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comparisons',
        filter: `household_id=eq.${householdId}`,
      }, () => { if (!syncingRef.current) refetch() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comparison_queue',
        filter: `household_id=eq.${householdId}`,
      }, () => { if (!syncingRef.current) refetch() })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId])

  // Refetch all data (called by realtime)
  const refetch = useCallback(async () => {
    if (!householdId) return
    const [itemsRes, compsRes, queueRes] = await Promise.all([
      supabase.from('wishlist_items').select('*').eq('household_id', householdId).order('added_at'),
      supabase.from('comparisons').select('*').eq('household_id', householdId).order('timestamp'),
      supabase.from('comparison_queue').select('*').eq('household_id', householdId).order('position'),
    ])
    const loaded: WishlistStore = {
      items: (itemsRes.data ?? []).map(rowToItem),
      comparisons: (compsRes.data ?? []).map(rowToComparison),
      comparisonQueue: (queueRes.data ?? []).map(rowToTask),
      lastUpdated: Date.now(),
    }
    setStoreLocal(loaded)
    prevStoreRef.current = loaded
  }, [householdId, supabase])

  // Sync-aware setStore: updates local state, then diffs and writes to Supabase
  const setStore = useCallback(
    (updater: WishlistStore | ((prev: WishlistStore) => WishlistStore)) => {
      setStoreLocal((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater

        // Fire off sync in the background
        if (householdId) {
          syncToSupabase(prev, next, householdId)
        }

        prevStoreRef.current = next
        return next
      })
    },
    [householdId] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Diff old vs new store and sync changes to Supabase
  async function syncToSupabase(prev: WishlistStore, next: WishlistStore, hid: string) {
    syncingRef.current = true
    try {
      // --- Items: updates ---
      for (const item of next.items) {
        const old = prev.items.find((i) => i.id === item.id)
        if (old && (old.eloRating !== item.eloRating || old.comparisonCount !== item.comparisonCount || old.price !== item.price || old.name !== item.name)) {
          await supabase.from('wishlist_items').update({
            elo_rating: item.eloRating,
            comparison_count: item.comparisonCount,
            name: item.name,
            price: item.price,
            image_url: item.imageUrl,
          }).eq('id', item.id)
        }
      }

      // --- Items: deletes ---
      for (const old of prev.items) {
        if (!next.items.find((i) => i.id === old.id)) {
          await supabase.from('wishlist_items').delete().eq('id', old.id)
        }
      }

      // --- Comparisons: inserts ---
      const prevCompIds = new Set(prev.comparisons.map((c) => c.id))
      for (const comp of next.comparisons) {
        if (!prevCompIds.has(comp.id)) {
          await supabase.from('comparisons').insert({
            id: comp.id,
            household_id: hid,
            item_a_id: comp.itemAId,
            item_b_id: comp.itemBId,
            winner_id: comp.winnerId,
            timestamp: comp.timestamp,
          })
        }
      }

      // --- Queue: full replace (simpler than diffing) ---
      const prevQueue = JSON.stringify(prev.comparisonQueue)
      const nextQueue = JSON.stringify(next.comparisonQueue)
      if (prevQueue !== nextQueue) {
        await supabase.from('comparison_queue').delete().eq('household_id', hid)
        if (next.comparisonQueue.length > 0) {
          await supabase.from('comparison_queue').insert(
            next.comparisonQueue.map((t, i) => ({
              household_id: hid,
              item_a_id: t.itemAId,
              item_b_id: t.itemBId,
              priority: t.priority,
              reason: t.reason,
              insertion_state: t.insertionState ?? null,
              position: i,
            }))
          )
        }
      }
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      syncingRef.current = false
    }
  }

  // CRUD methods (same signature as useWishlist)
  const addItem = useCallback(
    (draft: Omit<WishlistItem, 'id' | 'addedAt' | 'eloRating' | 'comparisonCount'>): WishlistItem => {
      const newItem: WishlistItem = {
        ...draft,
        id: crypto.randomUUID(),
        addedAt: Date.now(),
        eloRating: STARTING_ELO,
        comparisonCount: 0,
      }

      // Optimistic local update
      setStoreLocal((prev) => {
        const next = { ...prev, items: [...prev.items, newItem] }
        prevStoreRef.current = next
        return next
      })

      // Write to Supabase
      if (householdId) {
        supabase.from('wishlist_items').insert({
          id: newItem.id,
          household_id: householdId,
          name: newItem.name,
          description: newItem.description ?? null,
          price: newItem.price ?? null,
          image_url: newItem.imageUrl ?? null,
          product_url: newItem.productUrl ?? null,
          retailer: newItem.retailer ?? null,
          added_at: newItem.addedAt,
          elo_rating: newItem.eloRating,
          comparison_count: newItem.comparisonCount,
          bundled_items: newItem.bundledItems ?? [],
        }).then(({ error }) => {
          if (error) console.error('Insert item error:', error)
        })
      }

      return newItem
    },
    [householdId, supabase]
  )

  const deleteItem = useCallback(
    (id: string) => {
      setStoreLocal((prev) => {
        const next = {
          ...prev,
          items: prev.items.filter((i) => i.id !== id),
          comparisons: prev.comparisons.filter((c) => c.itemAId !== id && c.itemBId !== id),
          comparisonQueue: prev.comparisonQueue.filter(
            (t) => t.itemAId !== id && t.itemBId !== id && t.insertionState?.newItemId !== id
          ),
        }
        prevStoreRef.current = next
        return next
      })

      if (householdId) {
        supabase.from('wishlist_items').delete().eq('id', id)
          .then(({ error }) => { if (error) console.error('Delete error:', error) })
      }
    },
    [householdId, supabase]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<WishlistItem>) => {
      setStoreLocal((prev) => {
        const next = {
          ...prev,
          items: prev.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }
        prevStoreRef.current = next
        return next
      })

      if (householdId) {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.price !== undefined) dbUpdates.price = updates.price
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
        if (updates.eloRating !== undefined) dbUpdates.elo_rating = updates.eloRating
        if (updates.comparisonCount !== undefined) dbUpdates.comparison_count = updates.comparisonCount
        if (updates.bundledItems !== undefined) dbUpdates.bundled_items = updates.bundledItems

        if (Object.keys(dbUpdates).length > 0) {
          supabase.from('wishlist_items').update(dbUpdates).eq('id', id)
            .then(({ error }) => { if (error) console.error('Update error:', error) })
        }
      }
    },
    [householdId, supabase]
  )

  const sortedItems = [...store.items].sort((a, b) => b.eloRating - a.eloRating)

  return { store, setStore, sortedItems, addItem, deleteItem, updateItem, hydrated, householdId }
}
