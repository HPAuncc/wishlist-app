'use client'

import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { useComparisons } from '@/hooks/useComparisons'
import RankedList from '@/components/list/RankedList'
import BottomNav from '@/components/layout/BottomNav'

export default function ListPage() {
  const { store, setStore, sortedItems, deleteItem, hydrated } = useWishlist()
  const { queueLength } = useComparisons(store, setStore)

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 z-10">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Wishlist</h1>
          <div className="flex items-center gap-2">
            {queueLength > 0 && (
              <Link
                href="/compare"
                className="py-1.5 px-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold"
              >
                Compare ({queueLength})
              </Link>
            )}
            <Link
              href="/add"
              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full flex items-center justify-center transition-colors"
              aria-label="Add item"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 max-w-lg mx-auto w-full pt-4">
        {!hydrated ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <RankedList items={sortedItems} onDelete={deleteItem} compareCount={queueLength} />
        )}
      </main>

      <BottomNav compareCount={queueLength} />
    </div>
  )
}
