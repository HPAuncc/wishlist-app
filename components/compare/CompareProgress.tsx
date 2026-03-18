'use client'

import { motion } from 'framer-motion'

interface CompareProgressProps {
  remaining: number
  total?: number
}

export default function CompareProgress({ remaining, total }: CompareProgressProps) {
  const pct = total && total > 0 ? Math.max(0, ((total - remaining) / total) * 100) : 0

  return (
    <div className="px-4 space-y-1.5">
      {total && total > 0 && (
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}
      <p className="text-center text-xs text-zinc-600">
        {remaining > 0 ? (
          <>
            <span className="text-zinc-400 font-semibold">{remaining}</span> comparison{remaining !== 1 ? 's' : ''} left
          </>
        ) : (
          <span className="text-emerald-400 font-semibold">🎉 Fully ranked!</span>
        )}
      </p>
    </div>
  )
}
