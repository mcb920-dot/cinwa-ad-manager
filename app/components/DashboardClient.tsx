'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

const PARTNER_LIMIT = 20
const COVER_LIMIT = 4

export type Month = { id: number; name: string; active: boolean }
export type Category = { id: number; name: string }
export type PartnerSpot = { id: number; company_name: string; category_id: number; paid: boolean; active: boolean }
export type CoverSponsor = { id: number; company_name: string; position: string; paid: boolean; active: boolean }

export type MonthStats = {
  partnerUsed: number
  partnerRemaining: number
  coverUsed: number
  coverRemaining: number
  partnerSpots: PartnerSpot[]
  coverSponsors: CoverSponsor[]
}

type Props = {
  months: Month[]
  categories: Category[]
  initialMonthId: number | null
  initialStats: MonthStats
}

export default function DashboardClient({ months, categories, initialMonthId, initialStats }: Props) {
  const [selectedMonthId, setSelectedMonthId] = useState(initialMonthId)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const selectedMonth = months.find((m) => m.id === selectedMonthId)

  async function handleMonthChange(monthId: number) {
    setSelectedMonthId(monthId)
    setLoading(true)
    const [partnerCount, coverCount, partnerList, coverList] = await Promise.all([
      supabase.from('partner_spots').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('active', true),
      supabase.from('cover_sponsors').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('active', true),
      supabase.from('partner_spots').select('id, company_name, category_id, paid, active').eq('month_id', monthId).order('company_name'),
      supabase.from('cover_sponsors').select('id, company_name, position, paid, active').eq('month_id', monthId).order('company_name'),
    ])
    const partnerUsed = partnerCount.count ?? 0
    const coverUsed = coverCount.count ?? 0
    setStats({
      partnerUsed,
      partnerRemaining: Math.max(0, PARTNER_LIMIT - partnerUsed),
      coverUsed,
      coverRemaining: Math.max(0, COVER_LIMIT - coverUsed),
      partnerSpots: (partnerList.data ?? []) as PartnerSpot[],
      coverSponsors: (coverList.data ?? []) as CoverSponsor[],
    })
    setLoading(false)
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {selectedMonth ? selectedMonth.name : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-600 whitespace-nowrap">Viewing month</label>
          <select
            value={selectedMonthId ?? ''}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            disabled={loading}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {months.length === 0 && <option value="">No months</option>}
            {months.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        <InventoryCard label="Partner Spots" used={stats.partnerUsed} limit={PARTNER_LIMIT} remaining={stats.partnerRemaining} />
        <InventoryCard label="Cover Sponsors" used={stats.coverUsed} limit={COVER_LIMIT} remaining={stats.coverRemaining} />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Partner Spots — {selectedMonth?.name ?? ''}
        </h2>
        <div className={`bg-white rounded-xl border border-zinc-200 overflow-hidden transition-opacity duration-150 ${loading ? 'opacity-40' : ''}`}>
          {stats.partnerSpots.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-400">No partner spots for this month.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  {['Company', 'Category', 'Paid', 'Active'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.partnerSpots.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium">{s.company_name}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{catMap[s.category_id] ?? `#${s.category_id}`}</td>
                    <td className="px-4 py-2.5"><Badge on={s.paid} yes="Paid" no="Unpaid" /></td>
                    <td className="px-4 py-2.5"><Badge on={s.active} yes="Active" no="Inactive" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Cover Sponsors — {selectedMonth?.name ?? ''}
        </h2>
        <div className={`bg-white rounded-xl border border-zinc-200 overflow-hidden transition-opacity duration-150 ${loading ? 'opacity-40' : ''}`}>
          {stats.coverSponsors.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-400">No cover sponsors for this month.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  {['Company', 'Position', 'Paid', 'Active'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.coverSponsors.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium">{s.company_name}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{s.position}</td>
                    <td className="px-4 py-2.5"><Badge on={s.paid} yes="Paid" no="Unpaid" /></td>
                    <td className="px-4 py-2.5"><Badge on={s.active} yes="Active" no="Inactive" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

function InventoryCard({ label, used, limit, remaining }: { label: string; used: number; limit: number; remaining: number }) {
  const full = remaining === 0
  return (
    <div className={`rounded-xl border p-6 ${full ? 'bg-red-50 border-red-200' : 'bg-white border-zinc-200'}`}>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-zinc-900 leading-none">
        {used} <span className="text-lg font-normal text-zinc-400">/ {limit}</span>
      </p>
      <p className={`text-sm mt-2 font-medium ${full ? 'text-red-600' : 'text-zinc-500'}`}>
        {full ? 'No spots remaining' : `${remaining} remaining`}
      </p>
    </div>
  )
}

function Badge({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      on ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
    }`}>
      {on ? yes : no}
    </span>
  )
}
