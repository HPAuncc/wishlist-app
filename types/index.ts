export interface BundledItem {
  id: string
  name: string
  price?: number // stored in cents
  productUrl?: string
}

export interface WishlistItem {
  id: string
  name: string
  description?: string
  price?: number // stored in cents; for bundles this is the sum of bundledItems
  imageUrl?: string
  productUrl?: string
  retailer?: string
  addedAt: number
  eloRating: number
  comparisonCount: number
  bundledItems?: BundledItem[] // present when this item is a bundle of purchases
}

export interface Comparison {
  id: string
  itemAId: string
  itemBId: string
  winnerId: string
  timestamp: number
}

export interface ComparisonTask {
  itemAId: string
  itemBId: string
  priority: number
  reason: 'insertion' | 'calibration' | 'tiebreak'
  insertionState?: {
    newItemId: string
    sortedIds: string[]
    low: number
    high: number
  }
}

export interface WishlistStore {
  items: WishlistItem[]
  comparisons: Comparison[]
  comparisonQueue: ComparisonTask[]
  lastUpdated: number
}

export interface ScrapedMetadata {
  title?: string
  description?: string
  price?: string
  imageUrl?: string
  retailer?: string
  originalUrl: string
  partial?: boolean // true when only URL slug could be parsed (site blocked full fetch)
}

export type SwipeDirection = 'left' | 'right' | 'none'
