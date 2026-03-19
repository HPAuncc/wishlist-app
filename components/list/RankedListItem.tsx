'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WishlistItem, BundledItem } from '@/types'

interface RankedListItemProps {
  item: WishlistItem
  rank: number
  onDelete: (id: string) => void
}

const MEDALS = ['🥇', '🥈', '🥉']

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = [
      'bg-gradient-to-br from-yellow-300 to-yellow-500 text-zinc-900 shadow-lg shadow-yellow-500/30',
      'bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-900 shadow-lg shadow-zinc-400/20',
      'bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-900 shadow-lg shadow-amber-600/20',
    ]
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${colors[rank - 1]}`}>
        {MEDALS[rank - 1]}
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-zinc-800 text-zinc-500">
      #{rank}
    </div>
  )
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

const rankClass: Record<number, string> = {
  1: 'rank-1',
  2: 'rank-2',
  3: 'rank-3',
}

export default function RankedListItem({ item, rank, onDelete }: RankedListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const uncertain = item.comparisonCount < 3
  const extra = rankClass[rank] ?? ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`bg-zinc-900 rounded-2xl overflow-hidden ${extra}`}
    >
      <button
        className="w-full text-left p-4 flex items-center gap-3 active:bg-zinc-800/50 transition-colors"
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
          <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-2xl">
            🛍️
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`font-semibold truncate ${rank === 1 ? 'shimmer-text text-base' : 'text-zinc-100'}`}>
              {item.name}
            </p>
            {uncertain && (
              <span className="text-zinc-600 text-xs shrink-0" title="Position may shift with more comparisons">
                ~
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {item.bundledItems && item.bundledItems.length > 0 && (
              <span className="bg-violet-900/40 text-violet-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                📦 {item.bundledItems.length} items
              </span>
            )}
            {item.price != null && (
              <span className={`text-sm font-semibold ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-zinc-300' : 'text-emerald-400'}`}>
                {formatPrice(item.price)}
              </span>
            )}
            {item.retailer && (
              <span className="text-zinc-600 text-xs">{item.retailer}</span>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-zinc-600"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
              {item.description && (
                <p className="text-zinc-400 text-sm">{item.description}</p>
              )}

              {/* Bundle line items */}
              {item.bundledItems && item.bundledItems.length > 0 && (
                <div className="bg-zinc-800/60 rounded-xl overflow-hidden">
                  {item.bundledItems.map((bi: BundledItem, idx: number) => (
                    <div
                      key={bi.id}
                      className={`flex items-center justify-between px-3 py-2 ${idx > 0 ? 'border-t border-zinc-800' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-zinc-600 text-xs w-4 text-center shrink-0">{idx + 1}</span>
                        {bi.productUrl ? (
                          <a
                            href={bi.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-300 text-sm truncate hover:text-zinc-100 underline decoration-zinc-700"
                          >
                            {bi.name}
                          </a>
                        ) : (
                          <span className="text-zinc-300 text-sm truncate">{bi.name}</span>
                        )}
                      </div>
                      {bi.price != null && (
                        <span className="text-zinc-400 text-sm font-medium shrink-0 ml-2">{formatPrice(bi.price)}</span>
                      )}
                    </div>
                  ))}
                  {item.price != null && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-700 bg-zinc-800">
                      <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Total</span>
                      <span className="text-emerald-400 font-bold text-sm">{formatPrice(item.price)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {item.productUrl && (
                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-center font-medium transition-colors min-w-[120px]"
                  >
                    View Product ↗
                  </a>
                )}
                {!confirmDelete ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                    className="py-2.5 px-4 bg-zinc-800 hover:bg-red-950 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                      className="py-2.5 px-4 bg-red-950 hover:bg-red-900 rounded-xl text-sm font-medium text-red-300 transition-colors"
                    >
                      Yes, remove
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                      className="py-2.5 px-4 bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <p className="text-zinc-700 text-xs">
                {item.comparisonCount} comparison{item.comparisonCount !== 1 ? 's' : ''}
                {uncertain ? ' · still calibrating' : ' · well calibrated'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
