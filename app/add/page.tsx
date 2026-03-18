'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { useComparisons } from '@/hooks/useComparisons'
import AddItemForm from '@/components/items/AddItemForm'
import BottomNav from '@/components/layout/BottomNav'
import { WishlistItem } from '@/types'

type ItemDraft = Omit<WishlistItem, 'id' | 'addedAt' | 'eloRating' | 'comparisonCount'>

export default function AddPage() {
  const router = useRouter()
  const { store, setStore, addItem, hydrated } = useWishlist()
  const { queueNewItem, queueLength } = useComparisons(store, setStore)

  function handleAdd(draft: ItemDraft) {
    const newItem = addItem(draft)
    queueNewItem(newItem)
    router.push('/list')
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 z-10">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <Link href="/list" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold">Add Item</h1>
        </div>
      </header>

      <main className="flex flex-col flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {!hydrated ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <AddItemForm onAdd={handleAdd} />
        )}
      </main>

      <BottomNav compareCount={queueLength} />
    </div>
  )
}
