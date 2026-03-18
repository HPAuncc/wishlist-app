'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const PROMPTS = [
  'Which would you grab first? 👆',
  'If you could only buy one... 🤔',
  'Which is more urgent? ⚡',
  'What takes priority? 🎯',
  'Which do you need sooner? 📦',
]

export default function SwipeArena({ task, items, queueLength, onChoose }: SwipeArenaProps) {
  const itemA = useMemo(() => items.find((i) => i.id === task.itemAId), [items, task.itemAId])
  const itemB = useMemo(() => items.find((i) => i.id === task.itemBId), [items, task.itemBId])

  const prompt = useMemo(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.itemAId, task.itemBId]
  )

  if (!itemA || !itemB) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${task.itemAId}-${task.itemBId}`}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col gap-3 flex-1"
      >
        {/* Prompt */}
        <div className="text-center px-4">
          <p className="text-zinc-300 text-base font-semibold">{prompt}</p>
          <p className="text-zinc-600 text-xs mt-0.5">Swipe a card or tap a button below</p>
        </div>

        {/* Cards */}
        <div className="flex gap-2 px-3 flex-1" style={{ minHeight: 0 }}>
          <SwipeCard item={itemA} side="left" onChoose={() => onChoose(itemA.id)} />

          <div className="flex items-center justify-center shrink-0 flex-col gap-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <span className="text-white text-[10px] font-black tracking-wider">VS</span>
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
      </motion.div>
    </AnimatePresence>
  )
}
