'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface BottomNavProps {
  compareCount?: number
}

export default function BottomNav({ compareCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const links = [
    {
      href: '/list',
      label: 'List',
      emoji: '📋',
      activeEmoji: '📋',
    },
    {
      href: '/compare',
      label: 'Compare',
      emoji: '⚡',
      activeEmoji: '⚡',
    },
    {
      href: '/add',
      label: 'Add',
      emoji: '➕',
      activeEmoji: '➕',
    },
    {
      href: '/household',
      label: 'Settings',
      emoji: '⚙️',
      activeEmoji: '⚙️',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-zinc-900/85 backdrop-blur-xl border-t border-white/5 shadow-2xl">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {links.map(({ href, label, emoji }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 relative py-2 px-5 rounded-2xl transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/8 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className={`text-xl transition-transform ${active ? 'scale-110' : 'scale-100 opacity-60'}`}>
                  {emoji}
                </span>
                <span className={`text-[10px] font-semibold relative ${active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {label}
                </span>
                {label === 'Compare' && compareCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-3 bg-emerald-500 text-zinc-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {compareCount > 9 ? '9+' : compareCount}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
