'use client'

import { useMemo } from 'react'
import { WishlistItem, ComparisonTask } from '@/types'
import SwipeCard from './SwipeCard'
import CompareButtons from './CompareButtons'
import CompareProgress from './CompareProgress'

interface SwipeArenaProps {
  task: ComparisonTask
  items: WishlistItem[]
  queueLength: number
  onChoose: (winnerId: string) => void
}

export default function SwipeArena({ task, items, queueLength, onChoose }: SwipeArenaProps) {
  const itemA = useMemo(() => items.find((i) => i.id === task.itemAId), [items, task.itemAId])
  const itemB = useMemo(() => items.find((i) => i.id === task.itemBId), [items, task.itemBId])

  if (!itemA || !itemB) return null

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="text-center px-4">
        <p className="text-zinc-400 text-sm font-medium">Which do you need first?</p>
      </div>

      <div className="flex gap-3 px-4 flex-1" style={{ minHeight: 0 }}>
        <SwipeCard item={itemA} side="left" onChoose={() => onChoose(itemA.id)} />

        <div className="flex items-center justify-center shrink-0">
          <div className="bg-zinc-800 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-zinc-400 text-xs font-bold">VS</span>
          </div>
        </div>

        <SwipeCard item={itemB} side="right" onChoose={() => onChoose(itemB.id)} />
      </div>

      <CompareProgress remaining={queueLength} />
      <CompareButtons
        leftName={itemA.name}
        rightName={itemB.name}
        onChooseLeft={() => onChoose(itemA.id)}
        onChooseRight={() => onChoose(itemB.id)}
      />
    </div>
  )
}
