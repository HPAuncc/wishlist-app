'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { WishlistItem } from '@/types'

interface SwipeCardProps {
  item: WishlistItem
  side: 'left' | 'right'
  onChoose: () => void
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function SwipeCard({ item, side, onChoose }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], side === 'left' ? [-10, 0, 10] : [10, 0, -10])

  // Badge: appears when dragging toward center (outward from side)
  const badgeOpacity = useTransform(x, side === 'left' ? [25, 100] : [-100, -25], [0, 1])
  const badgeScale = useTransform(x, side === 'left' ? [25, 100] : [-100, -25], [0.7, 1])

  // Green glow overlay when dragging to choose
  const glowOpacity = useTransform(x, side === 'left' ? [0, 120] : [-120, 0], [0, 0.5])

  const constraintRef = useRef(null)

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x
    const velocity = info.velocity.x

    const shouldCommit =
      Math.abs(offset) > 80 || Math.abs(velocity) > 400

    if (shouldCommit) {
      const flyX = offset > 0 ? 700 : -700
      animate(x, flyX, { duration: 0.22, ease: 'easeOut' }).then(onChoose)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 })
    }
  }

  return (
    <div ref={constraintRef} className="relative flex-1 touch-none select-none">
      <motion.div
        drag="x"
        dragConstraints={constraintRef}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        style={{ x, rotate }}
        whileTap={{ scale: 0.97 }}
        className="bg-zinc-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing h-full flex flex-col border border-zinc-800"
      >
        {/* Green pick glow overlay */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent z-10 pointer-events-none rounded-2xl"
        />

        {/* Choice badge */}
        <motion.div
          style={{ opacity: badgeOpacity, scale: badgeScale }}
          className="absolute inset-x-0 top-2.5 flex justify-center z-20 pointer-events-none"
        >
          <span className="bg-emerald-400 text-zinc-950 text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-500/40 tracking-wide">
            ✓ PICK
          </span>
        </motion.div>

        {/* Image */}
        <div className="w-full aspect-square bg-zinc-800/80 relative shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🛍️
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            {item.bundledItems && item.bundledItems.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-violet-900/50 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5">
                📦 {item.bundledItems.reduce((sum, bi) => sum + (bi.quantity ?? 1), 0)} items
              </span>
            )}
            <p className="font-bold text-zinc-100 text-sm leading-snug line-clamp-2">
              {item.name}
            </p>
          </div>
          <div className="mt-2">
            {item.price != null && (
              <p className="text-emerald-400 text-sm font-bold">{formatPrice(item.price)}</p>
            )}
            {item.retailer && (
              <p className="text-zinc-600 text-xs mt-0.5">{item.retailer}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
