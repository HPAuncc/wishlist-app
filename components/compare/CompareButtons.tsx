'use client'

import { motion } from 'framer-motion'

interface CompareButtonsProps {
  leftName: string
  rightName: string
  onChooseLeft: () => void
  onChooseRight: () => void
}

export default function CompareButtons({
  leftName,
  rightName,
  onChooseLeft,
  onChooseRight,
}: CompareButtonsProps) {
  return (
    <div className="flex gap-2 px-3 pb-1">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onChooseLeft}
        className="flex-1 py-3 px-3 bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-900/50 rounded-2xl text-sm font-bold text-zinc-300 transition-colors flex items-center justify-center gap-1.5 border border-zinc-700/50"
      >
        <span className="text-base">👈</span>
        <span className="truncate max-w-[100px]">{leftName}</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onChooseRight}
        className="flex-1 py-3 px-3 bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-900/50 rounded-2xl text-sm font-bold text-zinc-300 transition-colors flex items-center justify-center gap-1.5 border border-zinc-700/50"
      >
        <span className="truncate max-w-[100px]">{rightName}</span>
        <span className="text-base">👉</span>
      </motion.button>
    </div>
  )
}
