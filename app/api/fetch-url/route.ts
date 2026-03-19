import { NextRequest, NextResponse } from 'next/server'
import { parseMetadata, extractNameFromSlug, detectRetailer } from '@/lib/url-parser'
import { ScrapedMetadata } from '@/types'

async function fetchDirect(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

async function fetchViaMicrolink(url: string): Promise<ScrapedMetadata> {
  const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`
  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`Microlink HTTP ${response.status}`)
  const json = await response.json()
  if (json.status !== 'success') throw new Error('Microlink returned non-success')

  const data = json.data ?? {}
  return {
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    imageUrl: data.image?.url ?? data.logo?.url ?? undefined,
    price: data.price ?? undefined,
    retailer: detectRetailer(url) ?? new URL(url).hostname.replace(/^www\./, '').split('.')[0],
    originalUrl: url,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Malformed URL' }, { status: 400 })
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs allowed' }, { status: 400 })
    }

    const hostname = parsed.hostname.replace(/^www\./, '')
    const brandName = hostname.split('.')[0].toLowerCase()

    function proxyImage(imageUrl: string | undefined): string | undefined {
      if (!imageUrl) return undefined
      return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    }

    function isGenericTitle(title: string | undefined): boolean {
      if (!title) return true
      const t = title.toLowerCase()
      // Bot/error pages
      if (
        /(access.*(denied|blocked)|denied.*access|just a moment|403|404|forbidden|not found|attention required|verify.*human|are you human|security check|enable.*javascript|please wait|ddos.*protection|cloudflare|bot.*detect|captcha)/i.test(t)
      ) return true
      return (
        t.includes(brandName) ||
        t.split(' ').length < 3 ||
        /\|\s*(home|shop|store|furniture|decor|design|style|fashion|deals|sale)\b/.test(t) ||
        /(home\s+furniture|home\s+decor|outdoor\s+furniture|free\s+shipping|shop\s+now|official\s+site)/.test(t)
      )
    }

    // Try direct fetch first
    try {
      const html = await fetchDirect(url)
      const metadata = parseMetadata(html, url)
      if (metadata.title && !isGenericTitle(metadata.title)) {
        return NextResponse.json({ ...metadata, imageUrl: proxyImage(metadata.imageUrl) })
      }
      throw new Error('No useful title found in direct fetch')
    } catch {
      // Fall through to Microlink
    }

    // Fallback: Microlink (handles bot-protected sites)
    try {
      const metadata = await fetchViaMicrolink(url)
      if (!isGenericTitle(metadata.title)) {
        return NextResponse.json({ ...metadata, imageUrl: proxyImage(metadata.imageUrl) })
      }
      throw new Error('Microlink returned generic title')
    } catch {
      // Last resort: extract name from URL slug so user gets something useful
      const slugName = extractNameFromSlug(url)
      if (slugName) {
        const partial: ScrapedMetadata = {
          title: slugName,
          retailer: detectRetailer(url),
          originalUrl: url,
          partial: true,
        }
        return NextResponse.json(partial)
      }
      return NextResponse.json({ error: 'Could not fetch that URL' }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 })
  }
}
