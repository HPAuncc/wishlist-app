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
      <header className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 z-10">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="text-lg font-black tracking-tight">⚡ Compare</h1>
          <Link href="/add" className="text-emerald-400 text-sm font-bold active:scale-95 transition-transform">
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
          <div className="flex flex-col items-center justify-center flex-1 gap-5 px-8 text-center">
            <div className="text-6xl">🤷</div>
            <div>
              <h2 className="text-xl font-bold text-zinc-200">Nothing to compare yet</h2>
              <p className="text-zinc-500 text-sm mt-1">Add at least 2 items to start swiping</p>
            </div>
            <Link href="/add" className="py-3 px-8 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-bold rounded-2xl transition-all">
              Add Items
            </Link>
          </div>
        ) : allDone ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-5 px-8 text-center">
            <div className="text-6xl">🏆</div>
            <div>
              <h2 className="text-xl font-bold text-zinc-200">All caught up!</h2>
              <p className="text-zinc-500 text-sm mt-1">Your list is fully ranked. Add more items to keep refining.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/list" className="py-3 px-5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 rounded-2xl text-sm font-bold transition-all">
                View List 📋
              </Link>
              <Link href="/add" className="py-3 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 rounded-2xl text-sm font-bold transition-all">
                Add Item ➕
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
