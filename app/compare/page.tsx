'use client'

import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { useComparisons } from '@/hooks/useComparisons'
import SwipeArena from '@/components/compare/SwipeArena'
import BottomNav from '@/components/layout/BottomNav'

export default function ComparePage() {
  const { store, setStore, hydrated } = useWishlist()
  const { currentTask, queueLength, recordComparison } = useComparisons(store, setStore)

  const noItems = store.items.length < 2
  const allDone = store.items.length >= 2 && !currentTask

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 z-10">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Compare</h1>
          <Link href="/add" className="text-emerald-400 text-sm font-medium">
            + Add item
          </Link>
        </div>
      </header>

      <main className="flex flex-col flex-1 max-w-lg mx-auto w-full pt-4 gap-4">
        {!hydrated ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : noItems ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-300">Nothing to compare yet</h2>
            <p className="text-zinc-500 text-sm">Add at least 2 items to your list first</p>
            <Link href="/add" className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-2xl transition-colors">
              Add Items
            </Link>
          </div>
        ) : allDone ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-300">All caught up!</h2>
            <p className="text-zinc-500 text-sm">Your list is fully ranked. Add more items to refine it.</p>
            <div className="flex gap-3">
              <Link href="/list" className="py-3 px-5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm font-semibold transition-colors">
                View List
              </Link>
              <Link href="/add" className="py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-sm font-semibold transition-colors">
                Add Item
              </Link>
            </div>
          </div>
        ) : currentTask ? (
          <SwipeArena
            task={currentTask}
            items={store.items}
            queueLength={queueLength}
            onChoose={recordComparison}
          />
        ) : null}
      </main>

      <BottomNav compareCount={queueLength} />
    </div>
  )
}
