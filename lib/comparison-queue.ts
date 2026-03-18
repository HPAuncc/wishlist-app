import { WishlistItem, ComparisonTask } from '@/types'

export function generateBootstrapComparisons(items: WishlistItem[]): ComparisonTask[] {
  const tasks: ComparisonTask[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      tasks.push({
        itemAId: items[i].id,
        itemBId: items[j].id,
        priority: tasks.length,
        reason: 'calibration',
      })
    }
  }
  return tasks
}

export function startInsertionSearch(
  newItemId: string,
  sortedItems: WishlistItem[]
): ComparisonTask | null {
  if (sortedItems.length === 0) return null
  const low = 0
  const high = sortedItems.length - 1
  const mid = Math.floor((low + high) / 2)
  return {
    itemAId: newItemId,
    itemBId: sortedItems[mid].id,
    priority: 0,
    reason: 'insertion',
    insertionState: {
      newItemId,
      sortedIds: sortedItems.map((i) => i.id),
      low,
      high,
    },
  }
}

export function nextInsertionStep(
  task: ComparisonTask,
  newItemWon: boolean
): ComparisonTask | null {
  const state = task.insertionState
  if (!state) return null

  const { newItemId, sortedIds, low, high } = state
  const mid = Math.floor((low + high) / 2)
  const newLow = newItemWon ? mid + 1 : low
  const newHigh = newItemWon ? high : mid - 1

  if (newLow > newHigh) return null

  const newMid = Math.floor((newLow + newHigh) / 2)
  return {
    itemAId: newItemId,
    itemBId: sortedIds[newMid],
    priority: 0,
    reason: 'insertion',
    insertionState: { newItemId, sortedIds, low: newLow, high: newHigh },
  }
}

export function generateTiebreaks(
  items: WishlistItem[],
  existingQueue: ComparisonTask[]
): ComparisonTask[] {
  const tasks: ComparisonTask[] = []
  const queued = new Set(existingQueue.map((t) => `${t.itemAId}|${t.itemBId}`))

  const sorted = [...items].sort((a, b) => b.eloRating - a.eloRating)
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (
      Math.abs(a.eloRating - b.eloRating) <= 30 &&
      (a.comparisonCount < 3 || b.comparisonCount < 3)
    ) {
      if (!queued.has(`${a.id}|${b.id}`) && !queued.has(`${b.id}|${a.id}`)) {
        tasks.push({ itemAId: a.id, itemBId: b.id, priority: tasks.length, reason: 'tiebreak' })
        queued.add(`${a.id}|${b.id}`)
      }
    }
  }
  return tasks
}
