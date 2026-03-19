'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  display_name: string | null
  household_id: string | null
}

interface Household {
  id: string
  name: string
  invite_code: string
}

interface Member {
  display_name: string | null
}

export default function HouseholdPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profileData) { setLoading(false); return }
    setProfile(profileData)

    if (profileData.household_id) {
      const { data: hh } = await supabase
        .from('households')
        .select('*')
        .eq('id', profileData.household_id)
        .single()
      setHousehold(hh)

      const { data: memberData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('household_id', profileData.household_id)
      setMembers(memberData ?? [])
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [loadData])

  async function createHousehold() {
    if (!profile) return
    setError('')
    setActionLoading(true)

    const { data: hh, error: hhErr } = await supabase
      .from('households')
      .insert({ name: householdName.trim() || 'Our Wishlist' })
      .select()
      .single()

    if (hhErr || !hh) {
      setError(hhErr?.message ?? 'Failed to create household')
      setActionLoading(false)
      return
    }

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ household_id: hh.id })
      .eq('id', profile.id)

    if (profErr) {
      setError(profErr.message)
      setActionLoading(false)
      return
    }

    setActionLoading(false)
    await loadData()
  }

  async function joinHousehold() {
    if (!profile) return
    setError('')
    setActionLoading(true)

    const { data: hh, error: hhErr } = await supabase
      .from('households')
      .select('*')
      .eq('invite_code', inviteCode.trim().toLowerCase())
      .single()

    if (hhErr || !hh) {
      setError('Invalid invite code')
      setActionLoading(false)
      return
    }

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ household_id: hh.id })
      .eq('id', profile.id)

    if (profErr) {
      setError(profErr.message)
      setActionLoading(false)
      return
    }

    setActionLoading(false)
    router.push('/list')
    router.refresh()
  }

  async function copyInviteCode() {
    if (!household) return
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Already in a household — show info
  if (household) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{household.name}</h1>
            <p className="text-zinc-500 text-sm mt-1">Your shared wishlist</p>
          </div>

          <div className="bg-zinc-800 rounded-2xl p-4 space-y-3">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Members</p>
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-900/40 flex items-center justify-center text-sm font-bold text-emerald-400">
                  {(m.display_name ?? '?')[0].toUpperCase()}
                </div>
                <span className="text-zinc-200 text-sm">{m.display_name ?? 'Anonymous'}</span>
              </div>
            ))}
          </div>

          <div className="bg-zinc-800 rounded-2xl p-4 space-y-2">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Invite your partner</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-900 rounded-xl px-3 py-2 text-emerald-400 font-mono text-lg tracking-widest text-center">
                {household.invite_code}
              </code>
              <button
                onClick={copyInviteCode}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-medium transition-colors shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-zinc-600 text-xs">Share this code with your partner so they can join.</p>
          </div>

          <button
            onClick={() => router.push('/list')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-2xl text-sm transition-colors"
          >
            Go to Wishlist
          </button>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // No household yet — create or join
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set up your wishlist</h1>
          <p className="text-zinc-500 text-sm mt-1">Create a new list or join your partner&apos;s</p>
        </div>

        <div className="flex bg-zinc-800 rounded-2xl p-1">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'create' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'join' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            Join Partner
          </button>
        </div>

        {tab === 'create' && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Wishlist name (e.g. Our New Home)"
              className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={createHousehold}
              disabled={actionLoading}
              className="py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold rounded-2xl text-sm transition-colors"
            >
              {actionLoading ? 'Creating...' : 'Create Wishlist'}
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center tracking-widest"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={joinHousehold}
              disabled={actionLoading || !inviteCode.trim()}
              className="py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold rounded-2xl text-sm transition-colors"
            >
              {actionLoading ? 'Joining...' : 'Join Wishlist'}
            </button>
            <p className="text-zinc-600 text-xs text-center">
              Ask your partner for their invite code from Settings.
            </p>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full py-2.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
