'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { WishlistItem } from '@/types'
import RankedListItem from './RankedListItem'
import Link from 'next/link'

interface RankedListProps {
  items: WishlistItem[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<WishlistItem>) => void
  compareCount: number
}

export default function RankedList({ items, onDelete, onUpdate, compareCount }: RankedListProps) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center flex-1 gap-5 px-8 text-center py-20"
      >
        <div className="text-6xl">🛒</div>
        <div>
          <h2 className="text-xl font-bold text-zinc-200">Your wishlist is empty</h2>
          <p className="text-zinc-500 text-sm mt-1">Add things you want — then swipe to rank them</p>
        </div>
        <Link
          href="/add"
          className="mt-1 py-3 px-8 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-bold rounded-2xl transition-all text-sm"
        >
          Add First Item
        </Link>
      </motion.div>
    )
  }

  if (items.length === 1) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <RankedListItem item={items[0]} rank={1} onDelete={onDelete} onUpdate={onUpdate} />
        <div className="text-center py-6">
          <p className="text-zinc-500 text-sm">Add one more item to start comparing</p>
          <Link href="/add" className="mt-2 inline-block text-emerald-400 text-sm font-semibold">
            + Add another
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      <AnimatePresence>
        {compareCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Link
              href="/compare"
              className="flex items-center justify-between bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3 mb-1 active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="text-emerald-400 font-bold text-sm">
                  {compareCount} comparison{compareCount !== 1 ? 's' : ''} pending ✨
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Tap to keep ranking</p>
              </div>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {items.map((item, idx) => (
          <RankedListItem key={item.id} item={item} rank={idx + 1} onDelete={onDelete} onUpdate={onUpdate} />
        ))}
      </AnimatePresence>

      {compareCount === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-zinc-700 text-xs py-4"
        >
          🎯 Fully ranked · Add items to keep refining
        </motion.p>
      )}
    </div>
  )
}
