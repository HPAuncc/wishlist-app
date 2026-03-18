'use client'

import { WishlistItem } from '@/types'
import RankedListItem from './RankedListItem'
import Link from 'next/link'

interface RankedListProps {
  items: WishlistItem[]
  onDelete: (id: string) => void
  compareCount: number
}

export default function RankedList({ items, onDelete, compareCount }: RankedListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center py-20">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-300">Your wishlist is empty</h2>
        <p className="text-zinc-500 text-sm">Add items to get started</p>
        <Link
          href="/add"
          className="mt-2 py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-2xl transition-colors"
        >
          Add First Item
        </Link>
      </div>
    )
  }

  if (items.length === 1) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <RankedListItem item={items[0]} rank={1} onDelete={onDelete} />
        <div className="text-center py-6">
          <p className="text-zinc-500 text-sm">Add at least 2 items to start comparing</p>
          <Link href="/add" className="mt-2 inline-block text-emerald-400 text-sm font-medium">
            Add another item →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      {compareCount > 0 && (
        <Link
          href="/compare"
          className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 mb-1"
        >
          <div>
            <p className="text-emerald-400 font-semibold text-sm">
              {compareCount} comparison{compareCount !== 1 ? 's' : ''} pending
            </p>
            <p className="text-zinc-400 text-xs">Tap to refine your ranking</p>
          </div>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      )}

      {items.map((item, idx) => (
        <RankedListItem key={item.id} item={item} rank={idx + 1} onDelete={onDelete} />
      ))}

      {compareCount === 0 && items.length >= 2 && (
        <p className="text-center text-zinc-600 text-xs py-4">
          List fully ranked · Add more items to refine
        </p>
      )}
    </div>
  )
}
