import { WishlistStore } from '@/types'

const STORAGE_KEY = 'wishlist_v1'

const DEFAULT_STORE: WishlistStore = {
  items: [],
  comparisons: [],
  comparisonQueue: [],
  lastUpdated: Date.now(),
}

export function loadStore(): WishlistStore {
  if (typeof window === 'undefined') return DEFAULT_STORE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STORE
    return JSON.parse(raw) as WishlistStore
  } catch {
    return DEFAULT_STORE
  }
}

export function saveStore(store: WishlistStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, lastUpdated: Date.now() }))
  } catch (e) {
    console.warn('Could not save wishlist:', e)
  }
}

export function exportStore(store: WishlistStore): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(store))))
}

export function importStore(encoded: string): WishlistStore | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as WishlistStore
  } catch {
    return null
  }
}
