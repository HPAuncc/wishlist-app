'use client'

import { useState } from 'react'
import { useUrlScraper } from '@/hooks/useUrlScraper'
import { WishlistItem, BundledItem } from '@/types'

type ItemDraft = Omit<WishlistItem, 'id' | 'addedAt' | 'eloRating' | 'comparisonCount'>

interface AddItemFormProps {
  onAdd: (item: ItemDraft, removeIds?: string[]) => void
  existingItems?: WishlistItem[]
}

function parsePriceInput(raw: string): number | undefined {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return undefined
  return Math.round(num * 100)
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function AddItemForm({ onAdd, existingItems = [] }: AddItemFormProps) {
  const [tab, setTab] = useState<'url' | 'manual' | 'bundle'>('url')
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

  // Bundle state
  const [bundleName, setBundleName] = useState('')
  const [bundleImageUrl, setBundleImageUrl] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bundleLines, setBundleLines] = useState<Array<{ id: string; name: string; price: string; qty: number; url: string }>>([
    { id: '1', name: '', price: '', qty: 1, url: '' },
  ])

  function addBundleLine() {
    setBundleLines((prev) => [...prev, { id: Date.now().toString(), name: '', price: '', qty: 1, url: '' }])
  }

  function removeBundleLine(id: string) {
    setBundleLines((prev) => prev.filter((l) => l.id !== id))
  }

  function updateBundleLine(id: string, field: 'name' | 'price' | 'url', value: string) {
    setBundleLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  function updateBundleLineQty(id: string, qty: number) {
    setBundleLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)))
  }

  // Track quantities for existing items too
  const [selectedQtys, setSelectedQtys] = useState<Record<string, number>>({})

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setSelectedQtys((q) => { const n = { ...q }; delete n[id]; return n })
      } else {
        next.add(id)
        setSelectedQtys((q) => ({ ...q, [id]: 1 }))
      }
      return next
    })
  }

  function updateSelectedQty(id: string, qty: number) {
    setSelectedQtys((prev) => ({ ...prev, [id]: Math.max(1, qty) }))
  }

  function bundleTotal(): number {
    const manualTotal = bundleLines.reduce((sum, l) => sum + (parsePriceInput(l.price) ?? 0) * l.qty, 0)
    const selectedTotal = existingItems
      .filter((i) => selectedIds.has(i.id))
      .reduce((sum, i) => sum + (i.price ?? 0) * (selectedQtys[i.id] ?? 1), 0)
    return manualTotal + selectedTotal
  }

  function handleBundleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bundleName.trim()) return

    // Items from existing list
    const fromExisting: BundledItem[] = existingItems
      .filter((i) => selectedIds.has(i.id))
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: selectedQtys[i.id] ?? 1,
        productUrl: i.productUrl,
      }))

    // Items from manual line entries
    const fromManual: BundledItem[] = bundleLines
      .filter((l) => l.name.trim())
      .map((l) => ({
        id: l.id,
        name: l.name.trim(),
        price: parsePriceInput(l.price),
        quantity: l.qty,
        productUrl: l.url.trim() || undefined,
      }))

    const bundledItems = [...fromExisting, ...fromManual]
    if (bundledItems.length === 0) return

    const total = bundledItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
    // Use the first selected item's image as the bundle image if none provided
    const fallbackImage = existingItems.find((i) => selectedIds.has(i.id) && i.imageUrl)?.imageUrl
    const removeIds = [...selectedIds]

    onAdd(
      {
        name: bundleName.trim(),
        price: total > 0 ? total : undefined,
        imageUrl: bundleImageUrl.trim() || fallbackImage || undefined,
        bundledItems,
      },
      removeIds.length > 0 ? removeIds : undefined
    )
    setBundleName('')
    setBundleImageUrl('')
    setSelectedIds(new Set())
    setSelectedQtys({})
    setBundleLines([{ id: '1', name: '', price: '', qty: 1, url: '' }])
  }

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
        {([['url', 'From URL'], ['manual', 'Manual'], ['bundle', '📦 Bundle']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
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

      {/* Bundle Tab */}
      {tab === 'bundle' && (
        <form onSubmit={handleBundleSubmit} className="flex flex-col gap-3">
          <p className="text-zinc-500 text-xs">
            Group items bought together into one ranked purchase. Select items from your list and/or add new ones.
          </p>

          <input
            type="text"
            value={bundleName}
            onChange={(e) => setBundleName(e.target.value)}
            placeholder="Bundle name (e.g. Replace Home Locks) *"
            required
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-violet-500"
          />

          <input
            type="url"
            value={bundleImageUrl}
            onChange={(e) => setBundleImageUrl(e.target.value)}
            placeholder="Bundle image URL (optional)"
            className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-violet-500"
          />

          {/* Select from existing items */}
          {existingItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide px-1">From your list</p>
              <div className="bg-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-700/50">
                {existingItems.map((item) => (
                  <div
                    key={item.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      selectedIds.has(item.id) ? 'bg-violet-900/30' : 'hover:bg-zinc-700/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelected(item.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedIds.has(item.id)
                          ? 'bg-violet-500 border-violet-500 text-white'
                          : 'border-zinc-600'
                      }`}>
                        {selectedIds.has(item.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-zinc-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0 text-sm">🛍️</div>
                      )}
                      <span className="text-sm text-zinc-200 truncate flex-1">{item.name}</span>
                    </button>
                    {selectedIds.has(item.id) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => updateSelectedQty(item.id, (selectedQtys[item.id] ?? 1) - 1)}
                          className="w-6 h-6 rounded-md bg-zinc-700 text-zinc-300 text-sm flex items-center justify-center hover:bg-zinc-600">−</button>
                        <span className="text-xs text-zinc-200 w-5 text-center font-medium">{selectedQtys[item.id] ?? 1}</span>
                        <button type="button" onClick={() => updateSelectedQty(item.id, (selectedQtys[item.id] ?? 1) + 1)}
                          className="w-6 h-6 rounded-md bg-zinc-700 text-zinc-300 text-sm flex items-center justify-center hover:bg-zinc-600">+</button>
                      </div>
                    )}
                    {item.price != null && (
                      <span className="text-zinc-500 text-xs shrink-0">{formatPrice(item.price * (selectedQtys[item.id] ?? 1))}</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <p className="text-violet-400 text-xs px-1">
                  {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected — will be merged into the bundle
                </p>
              )}
            </div>
          )}

          {/* Manual new items */}
          <div className="flex flex-col gap-2">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide px-1">Add new items</p>
            {bundleLines.map((line, i) => (
              <div key={line.id} className="bg-zinc-800 rounded-2xl px-3 py-2.5 flex gap-2 items-center">
                <span className="text-zinc-600 text-xs font-bold w-4 text-center shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={line.name}
                  onChange={(e) => updateBundleLine(line.id, 'name', e.target.value)}
                  placeholder="Item name"
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none min-w-0"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => updateBundleLineQty(line.id, line.qty - 1)}
                    className="w-5 h-5 rounded bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center hover:bg-zinc-600">−</button>
                  <span className="text-xs text-zinc-200 w-4 text-center">{line.qty}</span>
                  <button type="button" onClick={() => updateBundleLineQty(line.id, line.qty + 1)}
                    className="w-5 h-5 rounded bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center hover:bg-zinc-600">+</button>
                </div>
                <span className="text-zinc-600 text-sm shrink-0">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={line.price}
                  onChange={(e) => updateBundleLine(line.id, 'price', e.target.value)}
                  placeholder="0.00"
                  className="w-14 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none text-right shrink-0"
                />
                {bundleLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBundleLine(line.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addBundleLine}
              className="text-violet-400 hover:text-violet-300 text-sm font-medium py-1 transition-colors text-left px-1"
            >
              + Add item
            </button>
          </div>

          {/* Total */}
          {bundleTotal() > 0 && (
            <div className="flex justify-between items-center px-1 py-2 border-t border-zinc-800">
              <span className="text-zinc-400 text-sm font-medium">Total</span>
              <span className="text-emerald-400 font-bold text-base">{formatPrice(bundleTotal())}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!bundleName.trim() || (selectedIds.size === 0 && bundleLines.every((l) => !l.name.trim()))}
            className="py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-2xl text-sm transition-colors mt-1"
          >
            Add Bundle to List
          </button>
        </form>
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
