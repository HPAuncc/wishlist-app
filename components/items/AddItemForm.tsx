'use client'

import { useState } from 'react'
import { useUrlScraper } from '@/hooks/useUrlScraper'
import { WishlistItem } from '@/types'

type ItemDraft = Omit<WishlistItem, 'id' | 'addedAt' | 'eloRating' | 'comparisonCount'>

interface AddItemFormProps {
  onAdd: (item: ItemDraft) => void
}

function parsePriceInput(raw: string): number | undefined {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return undefined
  return Math.round(num * 100)
}

export default function AddItemForm({ onAdd }: AddItemFormProps) {
  const [tab, setTab] = useState<'url' | 'manual'>('url')
  const [urlInput, setUrlInput] = useState('')
  const { scrape, loading, error, result, reset } = useUrlScraper()

  // Manual / edit form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [productUrl, setProductUrl] = useState('')

  // Inline image paste for partial (blocked) results
  const [partialImageUrl, setPartialImageUrl] = useState('')
  const [partialPriceInput, setPartialPriceInput] = useState('')

  function addFromScrape() {
    if (!result) return
    if (result.partial) {
      onAdd({
        name: result.title ?? '',
        price: parsePriceInput(partialPriceInput),
        imageUrl: partialImageUrl.trim() || undefined,
        productUrl: result.originalUrl,
        retailer: result.retailer,
      })
      setPartialImageUrl('')
      setPartialPriceInput('')
    } else {
      onAdd({
        name: result.title ?? '',
        description: result.description,
        price: parsePriceInput(result.price ?? ''),
        imageUrl: result.imageUrl || undefined,
        productUrl: result.originalUrl,
        retailer: result.retailer,
      })
    }
    reset()
  }

  function populateFromScrape() {
    if (!result) return
    setName(result.title ?? '')
    setDescription(result.description ?? '')
    setPriceInput(result.price ?? '')
    setImageUrl(result.imageUrl ?? '')
    setProductUrl(result.originalUrl)
    setTab('manual')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      price: parsePriceInput(priceInput),
      imageUrl: imageUrl.trim() || undefined,
      productUrl: productUrl.trim() || undefined,
      retailer: result?.retailer,
    })
    // Reset
    setName('')
    setDescription('')
    setPriceInput('')
    setImageUrl('')
    setProductUrl('')
    reset()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex bg-zinc-800 rounded-2xl p-1">
        {(['url', 'manual'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'url' ? 'From URL' : 'Manual'}
          </button>
        ))}
      </div>

      {/* URL Tab */}
      {tab === 'url' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste product URL..."
              className="flex-1 bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => scrape(urlInput)}
              disabled={loading || !urlInput.trim()}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold rounded-2xl text-sm transition-colors whitespace-nowrap"
            >
              {loading ? '...' : 'Fetch'}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setTab('manual')}
                className="text-zinc-400 text-sm mt-1 underline"
              >
                Add manually instead
              </button>
            </div>
          )}

          {result && !error && (
            <div className={`rounded-2xl overflow-hidden ${result.partial ? 'bg-amber-950/40 border border-amber-800/40' : 'bg-zinc-800'}`}>
              {/* Header row */}
              <div className="flex gap-3 p-4 pb-3">
                {result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="w-16 h-16 rounded-xl object-cover bg-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-2xl border border-zinc-700">
                    🛍️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-100 text-sm line-clamp-2">
                    {result.title ?? 'Untitled'}
                  </p>
                  {result.price && (
                    <p className="text-emerald-400 text-sm mt-0.5">${result.price}</p>
                  )}
                  {result.retailer && (
                    <p className="text-zinc-500 text-xs mt-0.5">{result.retailer}</p>
                  )}
                </div>
              </div>

              {/* Partial: inline image + price fields */}
              {result.partial && (
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-amber-400 text-xs font-semibold">
                    ⚠️ {result.retailer ?? 'This store'} blocks auto-fetch. Paste the product image URL below for the best experience.
                  </p>
                  <div className="flex items-center gap-2 bg-zinc-900/60 rounded-xl px-3 py-2">
                    <span className="text-base shrink-0">🖼️</span>
                    <input
                      type="url"
                      value={partialImageUrl}
                      onChange={(e) => setPartialImageUrl(e.target.value)}
                      placeholder="Paste image URL (right-click image → Copy Image Address)"
                      className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900/60 rounded-xl px-3 py-2">
                    <span className="text-base shrink-0">💰</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={partialPriceInput}
                      onChange={(e) => setPartialPriceInput(e.target.value)}
                      placeholder="Price (e.g. 499.99)"
                      className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={addFromScrape}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition-colors"
                >
                  Add to List
                </button>
                <button
                  onClick={reset}
                  className="py-2.5 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <p className="text-zinc-600 text-xs text-center">
            Works with Etsy, IKEA, Amazon, Target & more. For blocked stores,
            paste the image URL from the product page.
          </p>
        </div>
      )}

      {/* Manual Tab */}
      {tab === 'manual' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name *"
            required
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="Price (e.g. 49.99)"
            inputMode="decimal"
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="Product URL (optional)"
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold rounded-2xl text-sm transition-colors mt-1"
          >
            Add to List
          </button>
        </form>
      )}
    </div>
  )
}
