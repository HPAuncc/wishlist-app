'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WishlistStore } from '@/types'
import { exportStore, importStore } from '@/lib/storage'

interface ShareModalProps {
  store: WishlistStore
  onImport: (store: WishlistStore) => void
  onClose: () => void
}

type Tab = 'export' | 'import'

export default function ShareModal({ store, onImport, onClose }: ShareModalProps) {
  const [tab, setTab] = useState<Tab>('export')
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const encoded = exportStore(store)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(encoded)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the text
      textareaRef.current?.select()
    }
  }

  function handleImport() {
    setImportError('')
    const trimmed = importText.trim()
    if (!trimmed) {
      setImportError('Paste your partner\'s wishlist code above.')
      return
    }
    const imported = importStore(trimmed)
    if (!imported) {
      setImportError('That code doesn\'t look right. Make sure you copied the whole thing.')
      return
    }
    onImport(imported)
    setImportSuccess(true)
    setTimeout(onClose, 1200)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/80 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="w-full max-w-lg bg-zinc-900 rounded-t-3xl overflow-hidden"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-700" />
          </div>

          <div className="px-5 pt-2 pb-8">
            <h2 className="text-xl font-black mb-4 text-center">💌 Share Wishlist</h2>

            {/* Tabs */}
            <div className="flex bg-zinc-800 rounded-2xl p-1 mb-5">
              {(['export', 'import'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                    tab === t
                      ? 'bg-zinc-950 text-zinc-100 shadow'
                      : 'text-zinc-500'
                  }`}
                >
                  {t === 'export' ? '📤 Send' : '📥 Receive'}
                </button>
              ))}
            </div>

            {tab === 'export' ? (
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm text-center">
                  Copy this code and send it to your partner via iMessage, WhatsApp, or wherever.
                </p>
                <textarea
                  ref={textareaRef}
                  readOnly
                  value={encoded}
                  rows={4}
                  className="w-full bg-zinc-800 rounded-2xl p-3 text-xs font-mono text-zinc-400 resize-none focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCopy}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-colors ${
                    copied
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-100 text-zinc-950 active:bg-zinc-300'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy to Clipboard'}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm text-center">
                  Paste the code you received to load their wishlist.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => { setImportText(e.target.value); setImportError('') }}
                  placeholder="Paste code here…"
                  rows={4}
                  className="w-full bg-zinc-800 rounded-2xl p-3 text-xs font-mono text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-zinc-700"
                />
                {importError && (
                  <p className="text-red-400 text-xs text-center">{importError}</p>
                )}
                {importSuccess ? (
                  <div className="w-full py-3.5 rounded-2xl font-bold text-sm text-center bg-emerald-500 text-zinc-950">
                    ✓ Loaded!
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleImport}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-zinc-100 text-zinc-950 active:bg-zinc-300 transition-colors"
                  >
                    Load Wishlist
                  </motion.button>
                )}
                <p className="text-zinc-600 text-xs text-center">
                  This replaces your current wishlist with theirs.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
