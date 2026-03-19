'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { useComparisons } from '@/hooks/useComparisons'
import RankedList from '@/components/list/RankedList'
import BottomNav from '@/components/layout/BottomNav'
import ShareModal from '@/components/list/ShareModal'

export default function ListPage() {
  const { store, setStore, sortedItems, deleteItem, hydrated } = useWishlist()
  const { queueLength } = useComparisons(store, setStore)
  const [showShare, setShowShare] = useState(false)

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 z-10">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="text-lg font-black tracking-tight">🛒 Wishlist</h1>
          <div className="flex items-center gap-2">
            {queueLength > 0 && (
              <Link
                href="/compare"
                className="py-1.5 px-3 bg-emerald-500/15 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/20 active:scale-95 transition-transform"
              >
                ⚡ {queueLength} left
              </Link>
            )}
            {sortedItems.length > 0 && (
              <button
                onClick={() => setShowShare(true)}
                className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 active:scale-90 rounded-full flex items-center justify-center transition-all text-base"
                aria-label="Share wishlist"
              >
                💌
              </button>
            )}
            <Link
              href="/add"
              className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-zinc-950 rounded-full flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 font-black text-lg"
              aria-label="Add item"
            >
              +
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

      {showShare && (
        <ShareModal
          store={store}
          onImport={(imported) => setStore(imported)}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
