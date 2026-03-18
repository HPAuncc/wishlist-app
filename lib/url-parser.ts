import { ScrapedMetadata } from '@/types'

function extractMetaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return undefined
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match?.[1]?.trim()
}

function extractJsonLdPrice(html: string): string | undefined {
  const scripts = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )
  if (!scripts) return undefined

  for (const script of scripts) {
    try {
      const content = script.replace(/<script[^>]*>/, '').replace(/<\/script>/i, '')
      const json = JSON.parse(content)
      const check = (obj: unknown): string | undefined => {
        if (!obj || typeof obj !== 'object') return undefined
        const o = obj as Record<string, unknown>
        if (o['@type'] === 'Product') {
          const offers = o.offers as Record<string, unknown> | undefined
          if (offers?.price) return String(offers.price)
        }
        for (const val of Object.values(o)) {
          if (typeof val === 'object') {
            const result = check(val)
            if (result) return result
          }
        }
        return undefined
      }
      const price = check(json)
      if (price) return price
    } catch {
      continue
    }
  }
  return undefined
}

// Generic segment words to skip when extracting product name from URL
const SKIP_SEGMENTS = new Set([
  'p', 'pd', 'pdp', 'product', 'products', 'item', 'items',
  'shop', 'store', 'buy', 'listing', 'detail', 'details',
  'us', 'en', 'en-us', 'catalog', 'category',
])

function isIdSegment(segment: string): boolean {
  // Pure numbers, or short alphanumeric IDs like "s619736", "B08N5LNQ3L"
  return /^\d+$/.test(segment) || /^[a-z]\d{4,}$/i.test(segment) || /^[A-Z0-9]{8,}$/.test(segment)
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function extractNameFromSlug(url: string): string | undefined {
  try {
    const { pathname } = new URL(url)
    const segments = pathname
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // Find the best segment: longest non-skip, non-ID segment
    const candidates = segments.filter(
      (s) => !SKIP_SEGMENTS.has(s.toLowerCase()) && !isIdSegment(s) && s.length > 3
    )

    if (candidates.length === 0) return undefined

    // Prefer longer segments (more descriptive product names)
    const best = candidates.reduce((a, b) => (b.length > a.length ? b : a))
    return toTitleCase(best)
  } catch {
    return undefined
  }
}

const RETAILER_MAP: Array<[string, string]> = [
  ['amazon.', 'Amazon'],
  ['target.com', 'Target'],
  ['walmart.com', 'Walmart'],
  ['bestbuy.com', 'Best Buy'],
  ['etsy.com', 'Etsy'],
  ['ikea.com', 'IKEA'],
  ['wayfair.com', 'Wayfair'],
  ['homedepot.com', 'Home Depot'],
  ['lowes.com', "Lowe's"],
  ['costco.com', 'Costco'],
  ['crateandbarrel.com', 'Crate & Barrel'],
  ['cb2.com', 'CB2'],
  ['potterybarn.com', 'Pottery Barn'],
  ['pbteen.com', 'PBteen'],
  ['westelm.com', 'West Elm'],
  ['williams-sonoma.com', 'Williams Sonoma'],
  ['zgallerie.com', 'Z Gallerie'],
  ['arhaus.com', 'Arhaus'],
  ['anthropologie.com', 'Anthropologie'],
  ['urbanoutfitters.com', 'Urban Outfitters'],
  ['cb2.com', 'CB2'],
  ['roomandboard.com', 'Room & Board'],
  ['serenaandlily.com', 'Serena & Lily'],
  ['restorationhardware.com', 'RH'],
  ['rh.com', 'RH'],
  ['overstock.com', 'Overstock'],
  ['bedbathandbeyond.com', 'Bed Bath & Beyond'],
  ['macys.com', "Macy's"],
  ['nordstrom.com', 'Nordstrom'],
  ['houzz.com', 'Houzz'],
  ['article.com', 'Article'],
  ['burrow.com', 'Burrow'],
  ['castlery.com', 'Castlery'],
  ['article.com', 'Article'],
]

export function detectRetailer(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    for (const [pattern, name] of RETAILER_MAP) {
      if (hostname.includes(pattern)) return name
    }
  } catch {
    // ignore
  }
  return undefined
}

export function parseMetadata(html: string, url: string): ScrapedMetadata {
  const title =
    extractMetaContent(html, 'og:title') ||
    extractMetaContent(html, 'twitter:title') ||
    extractTitle(html)

  const description =
    extractMetaContent(html, 'og:description') ||
    extractMetaContent(html, 'twitter:description') ||
    extractMetaContent(html, 'description')

  const imageUrl =
    extractMetaContent(html, 'og:image') ||
    extractMetaContent(html, 'twitter:image')

  const price =
    extractMetaContent(html, 'og:price:amount') ||
    extractMetaContent(html, 'product:price:amount') ||
    extractJsonLdPrice(html)

  return { title, description, imageUrl, price, retailer: detectRetailer(url), originalUrl: url }
}
