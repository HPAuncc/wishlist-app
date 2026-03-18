'use client'

import { useCallback } from 'react'
import { Dispatch, SetStateAction } from 'react'
import { WishlistItem, WishlistStore, Comparison, ComparisonTask } from '@/types'
import { updateElo } from '@/lib/elo'
import {
  generateBootstrapComparisons,
  startInsertionSearch,
  nextInsertionStep,
  generateTiebreaks,
} from '@/lib/comparison-queue'

export function useComparisons(
  store: WishlistStore,
  setStore: Dispatch<SetStateAction<WishlistStore>>
) {
  const currentTask = store.comparisonQueue[0] ?? null

  const queueNewItem = useCallback(
    (newItem: WishlistItem) => {
      setStore((prev) => {
        const existingItems = prev.items.filter((i) => i.id !== newItem.id)
        let newTasks: ComparisonTask[] = []

        if (existingItems.length < 3) {
          // Bootstrap: round-robin all items including the new one
          const allItems = [...existingItems, newItem]
          const all = generateBootstrapComparisons(allItems)
          const done = new Set(
            prev.comparisons.map((c) => `${c.itemAId}|${c.itemBId}`)
          )
          newTasks = all.filter(
            (t) =>
              !done.has(`${t.itemAId}|${t.itemBId}`) &&
              !done.has(`${t.itemBId}|${t.itemAId}`)
          )
        } else {
          const sorted = [...existingItems].sort((a, b) => b.eloRating - a.eloRating)
          const task = startInsertionSearch(newItem.id, sorted)
          if (task) newTasks = [task]
        }

        const tiebreaks = generateTiebreaks(prev.items, [...prev.comparisonQueue, ...newTasks])

        return {
          ...prev,
          comparisonQueue: [...prev.comparisonQueue, ...newTasks, ...tiebreaks],
        }
      })
    },
    [setStore]
  )

  const recordComparison = useCallback(
    (winnerId: string) => {
      setStore((prev) => {
        const task = prev.comparisonQueue[0]
        if (!task) return prev

        const loserId = task.itemAId === winnerId ? task.itemBId : task.itemAId
        const winner = prev.items.find((i) => i.id === winnerId)
        const loser = prev.items.find((i) => i.id === loserId)
        if (!winner || !loser) return prev

        const { newWinnerRating, newLoserRating } = updateElo(winner, loser)

        const comparison: Comparison = {
          id: crypto.randomUUID(),
          itemAId: task.itemAId,
          itemBId: task.itemBId,
          winnerId,
          timestamp: Date.now(),
        }

        let nextTask: ComparisonTask | null = null
        if (task.reason === 'insertion' && task.insertionState) {
          nextTask = nextInsertionStep(task, winnerId === task.insertionState.newItemId)
        }

        const remaining = prev.comparisonQueue.slice(1)
        const newQueue = nextTask ? [nextTask, ...remaining] : remaining

        const updatedItems = prev.items.map((item) => {
          if (item.id === winnerId)
            return { ...item, eloRating: newWinnerRating, comparisonCount: item.comparisonCount + 1 }
          if (item.id === loserId)
            return { ...item, eloRating: newLoserRating, comparisonCount: item.comparisonCount + 1 }
          return item
        })

        return {
          ...prev,
          items: updatedItems,
          comparisons: [...prev.comparisons, comparison],
          comparisonQueue: newQueue,
        }
      })
    },
    [setStore]
  )

  return { currentTask, queueLength: store.comparisonQueue.length, queueNewItem, recordComparison }
}
