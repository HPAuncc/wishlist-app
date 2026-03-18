'use client'

import { useState, useEffect, useCallback } from 'react'
import { WishlistItem, WishlistStore } from '@/types'
import { loadStore, saveStore } from '@/lib/storage'
import { STARTING_ELO } from '@/lib/elo'

export function useWishlist() {
  const [store, setStore] = useState<WishlistStore>({
    items: [],
    comparisons: [],
    comparisonQueue: [],
    lastUpdated: Date.now(),
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setStore(loadStore())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveStore(store)
  }, [store, hydrated])

  const addItem = useCallback(
    (item: Omit<WishlistItem, 'id' | 'addedAt' | 'eloRating' | 'comparisonCount'>): WishlistItem => {
      const newItem: WishlistItem = {
        ...item,
        id: crypto.randomUUID(),
        addedAt: Date.now(),
        eloRating: STARTING_ELO,
        comparisonCount: 0,
      }
      setStore((prev) => ({ ...prev, items: [...prev.items, newItem] }))
      return newItem
    },
    []
  )

  const deleteItem = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
      comparisons: prev.comparisons.filter((c) => c.itemAId !== id && c.itemBId !== id),
      comparisonQueue: prev.comparisonQueue.filter(
        (t) =>
          t.itemAId !== id &&
          t.itemBId !== id &&
          t.insertionState?.newItemId !== id
      ),
    }))
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<WishlistItem>) => {
    setStore((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
  }, [])

  const sortedItems = [...store.items].sort((a, b) => b.eloRating - a.eloRating)

  return { store, setStore, sortedItems, addItem, deleteItem, updateItem, hydrated }
}
