'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  compareCount?: number
}

export default function BottomNav({ compareCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const links = [
    {
      href: '/list',
      label: 'List',
      icon: (active: boolean) => (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            stroke={active ? '#10b981' : '#71717a'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: '/compare',
      label: 'Compare',
      icon: (active: boolean) => (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            d="M8 7l-4 5 4 5M16 7l4 5-4 5"
            stroke={active ? '#10b981' : '#71717a'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 3v18" stroke={active ? '#10b981' : '#71717a'} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: '/add',
      label: 'Add',
      icon: (active: boolean) => (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke={active ? '#10b981' : '#71717a'} strokeWidth="2" />
          <path d="M12 8v8M8 12h8" stroke={active ? '#10b981' : '#71717a'} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 relative py-2 px-4"
            >
              {icon(active)}
              <span
                className={`text-xs font-medium ${active ? 'text-emerald-500' : 'text-zinc-500'}`}
              >
                {label}
              </span>
              {label === 'Compare' && compareCount > 0 && (
                <span className="absolute top-1 right-2 bg-emerald-500 text-zinc-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {compareCount > 9 ? '9+' : compareCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
