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

function detectRetailer(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('amazon.')) return 'Amazon'
    if (hostname.includes('target.com')) return 'Target'
    if (hostname.includes('walmart.com')) return 'Walmart'
    if (hostname.includes('bestbuy.com')) return 'Best Buy'
    if (hostname.includes('etsy.com')) return 'Etsy'
    if (hostname.includes('ikea.com')) return 'IKEA'
    if (hostname.includes('wayfair.com')) return 'Wayfair'
    if (hostname.includes('homedepot.com')) return 'Home Depot'
    if (hostname.includes('lowes.com')) return "Lowe's"
    if (hostname.includes('costco.com')) return 'Costco'
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
