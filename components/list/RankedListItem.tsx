'use client'

import { useState } from 'react'
import { WishlistItem } from '@/types'

interface RankedListItemProps {
  item: WishlistItem
  rank: number
  onDelete: (id: string) => void
}

function RankBadge({ rank }: { rank: number }) {
  const base = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0'
  if (rank === 1) return <div className={`${base} bg-yellow-400 text-zinc-950`}>#1</div>
  if (rank === 2) return <div className={`${base} bg-zinc-400 text-zinc-950`}>#2</div>
  if (rank === 3) return <div className={`${base} bg-amber-600 text-zinc-950`}>#3</div>
  return <div className={`${base} bg-zinc-800 text-zinc-400`}>#{rank}</div>
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function RankedListItem({ item, rank, onDelete }: RankedListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const uncertain = item.comparisonCount < 3

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <RankBadge rank={rank} />

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-800"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                stroke="#52525b"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-zinc-100 truncate">{item.name}</p>
            {uncertain && (
              <span className="text-zinc-500 text-xs shrink-0" title="Position may shift with more comparisons">
                ~
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {item.price != null && (
              <span className="text-emerald-400 text-sm font-medium">{formatPrice(item.price)}</span>
            )}
            {item.retailer && (
              <span className="text-zinc-500 text-xs">{item.retailer}</span>
            )}
          </div>
        </div>

        <svg
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          className={`shrink-0 text-zinc-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
          {item.description && (
            <p className="text-zinc-400 text-sm">{item.description}</p>
          )}
          <div className="flex gap-2">
            {item.productUrl && (
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-center font-medium transition-colors"
              >
                View Product
              </a>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="py-2 px-4 bg-zinc-800 hover:bg-red-900 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(item.id)}
                  className="py-2 px-4 bg-red-900 hover:bg-red-800 rounded-xl text-sm font-medium text-red-300 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="py-2 px-4 bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <p className="text-zinc-600 text-xs">
            {item.comparisonCount} comparison{item.comparisonCount !== 1 ? 's' : ''}
            {uncertain ? ' · Position may shift as you add more comparisons' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
