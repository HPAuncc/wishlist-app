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
  const rotate = useTransform(x, [-200, 0, 200], side === 'left' ? [-12, 0, 12] : [12, 0, -12])
  const badgeOpacity = useTransform(x, side === 'left' ? [30, 120] : [-120, -30], [0, 1])
  const cardOpacity = useTransform(x, [-250, -100, 0, 100, 250], [0.6, 1, 1, 1, 0.6])
  const constraintRef = useRef(null)

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x
    const velocity = info.velocity.x
    const threshold = 80
    const velocityThreshold = 400

    const shouldCommit =
      Math.abs(offset) > threshold || Math.abs(velocity) > velocityThreshold

    if (shouldCommit) {
      const flyX = offset > 0 ? 600 : -600
      animate(x, flyX, { duration: 0.25, ease: 'easeOut' }).then(onChoose)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <div ref={constraintRef} className="relative flex-1 touch-none select-none">
      <motion.div
        drag="x"
        dragConstraints={constraintRef}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity: cardOpacity }}
        className="bg-zinc-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing h-full"
      >
        {/* Choice badge */}
        <motion.div
          style={{ opacity: badgeOpacity }}
          className="absolute inset-x-0 top-3 flex justify-center z-10 pointer-events-none"
        >
          <span className="bg-emerald-500 text-zinc-950 text-xs font-bold px-3 py-1 rounded-full">
            FIRST
          </span>
        </motion.div>

        {/* Image */}
        <div className="w-full aspect-square bg-zinc-800 relative">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold text-zinc-100 text-sm leading-tight line-clamp-2">
            {item.name}
          </p>
          {item.price != null && (
            <p className="text-emerald-400 text-sm font-medium mt-1">{formatPrice(item.price)}</p>
          )}
          {item.retailer && (
            <p className="text-zinc-500 text-xs mt-0.5">{item.retailer}</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
