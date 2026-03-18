'use client'

import { useState, useCallback } from 'react'
import { ScrapedMetadata } from '@/types'

export function useUrlScraper() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScrapedMetadata | null>(null)

  const scrape = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Failed')
      const data: ScrapedMetadata = await res.json()
      setResult(data)
    } catch {
      setError("Couldn't fetch that URL — try adding manually instead.")
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { scrape, loading, error, result, reset }
}
