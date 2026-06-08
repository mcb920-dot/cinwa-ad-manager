'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/src/lib/supabase'

const PARTNER_LIMIT = 20
const COVER_LIMIT = 4

type Month = { id: number; name: string }
type Category = { id: number; name: string }

type MonthData = {
  partnerUsed: number
  coverUsed: number
  takenCategoryIds: number[]
}

type Props = {
  months: Month[]
  categories: Category[]
  initialMonthId: number | null
  initialData: MonthData
}

export default function AvailabilityClient({ months, categories, initialMonthId, initialData }: Props) {
  const [selectedMonthId, setSelectedMonthId] = useState(initialMonthId)
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    console.log('[cinwa] availability initialData (from server):', initialData)
  }, [])

  const selectedMonth = months.find((m) => m.id === selectedMonthId)
  const takenSet = new Set(data.takenCategoryIds)
  const query = search.toLowerCase()
  const available = categories.filter((c) => !takenSet.has(c.id) && c.name.toLowerCase().includes(query))
  const taken = categories.filter((c) => takenSet.has(c.id) && c.name.toLowerCase().includes(query))
  const partnerRemaining = PARTNER_LIMIT - data.partnerUsed
  const coverRemaining = COVER_LIMIT - data.coverUsed

  async function handleMonthChange(monthId: number) {
    setSelectedMonthId(monthId)
    setLoading(true)
    const [partnerCount, paidPartnerCount, coverCount, paidCoverCount, takenSpots, paidTakenSpots] = await Promise.all([
      supabase.from('partner_spots').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('active', true),
      supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('package_type', 'featured_partner').in('status', ['Paid', 'Fulfilled']),
      supabase.from('cover_sponsors').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('active', true),
      supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('package_type', 'cover_sponsor').in('status', ['Paid', 'Fulfilled']),
      supabase.from('partner_spots').select('category_id').eq('month_id', monthId).eq('active', true),
      supabase.from('reservations').select('category_id, package_type, status').eq('month_id', monthId).in('status', ['Paid', 'Fulfilled']),
    ])
    console.log('[cinwa] availability debug', {
      monthId,
      partnerSpotsCount: partnerCount.count,
      paidPartnerResCount: paidPartnerCount.count,
      paidPartnerResError: paidPartnerCount.error,
      coverSpotsCount: coverCount.count,
      paidCoverResCount: paidCoverCount.count,
      allPaidRows: paidTakenSpots.data,
      allPaidRowsError: paidTakenSpots.error,
      takenFromSpots: takenSpots.data,
    })
    const paidPartnerRows = (paidTakenSpots.data ?? []).filter(
      (r: { package_type: string; status: string; category_id: number | null }) => r.package_type === 'featured_partner'
    )
    setData({
      partnerUsed: (partnerCount.count ?? 0) + (paidPartnerCount.count ?? 0),
      coverUsed: (coverCount.count ?? 0) + (paidCoverCount.count ?? 0),
      takenCategoryIds: [
        ...(takenSpots.data?.map((s: { category_id: number }) => s.category_id) ?? []),
        ...paidPartnerRows.map((r: { category_id: number | null }) => r.category_id).filter((id: number | null): id is number => id !== null),
      ],
    })
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Check Availability</h1>
        <p className="text-zinc-500 text-sm">Select a month to see open categories and inventory.</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-8">
        <label className="text-sm font-medium text-zinc-700 shrink-0">Month</label>
        {months.length === 0 ? (
          <p className="text-zinc-400 text-sm">No active months.</p>
        ) : (
          <select
            value={selectedMonthId ?? ''}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            disabled={loading}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {months.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className={`space-y-8 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Inventory */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Inventory — {selectedMonth?.name ?? ''}
          </h2>
          <ProgressBar label="Featured Partner Spots" used={data.partnerUsed} limit={PARTNER_LIMIT} remaining={partnerRemaining} />
          <ProgressBar label="Cover Sponsor Spots" used={data.coverUsed} limit={COVER_LIMIT} remaining={coverRemaining} />
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Category Availability — {selectedMonth?.name ?? ''}
            </h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full sm:w-52 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {categories.length === 0 ? (
            <p className="text-zinc-400 text-sm">No categories found.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">
                  Available ({available.length})
                </p>
                {available.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No matches.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                    {available.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-zinc-100 text-sm text-zinc-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {taken.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                    Taken ({taken.length})
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                    {taken.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-zinc-100 text-sm text-zinc-400 line-through">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                        {c.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50 rounded-xl border border-blue-100 p-5">
          <div>
            <p className="font-semibold text-zinc-900 text-sm">Ready to claim your spot?</p>
            <p className="text-zinc-500 text-sm mt-0.5">
              {partnerRemaining > 0
                ? `${partnerRemaining} Featured Partner ${partnerRemaining === 1 ? 'spot' : 'spots'} still available for ${selectedMonth?.name ?? 'this month'}.`
                : `Featured Partner spots are full for ${selectedMonth?.name ?? 'this month'}.`}
            </p>
          </div>
          <Link
            href={`/reserve${selectedMonthId ? `?month=${selectedMonthId}` : ''}`}
            className="shrink-0 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Reserve Your Spot →
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, used, limit, remaining }: { label: string; used: number; limit: number; remaining: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const full = remaining === 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className={`font-semibold ${full ? 'text-red-600' : 'text-zinc-500'}`}>
          {used} / {limit}{full ? ' — Full' : ` (${remaining} open)`}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${full ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
