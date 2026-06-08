'use client'
import { useState, useEffect } from 'react'
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

const EMPTY: MonthStats = {
  partnerUsed: 0,
  partnerRemaining: PARTNER_LIMIT,
  coverUsed: 0,
  coverRemaining: COVER_LIMIT,
  partnerSpots: [],
  coverSponsors: [],
}

export default function DashboardClient() {
  const [months, setMonths] = useState<Month[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null)
  const [stats, setStats] = useState<MonthStats>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const [{ data: monthData }, { data: catData }] = await Promise.all([
        supabase
          .from('months')
          .select('id, name, active')
          .eq('active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('categories')
          .select('id, name')
          .order('name'),
      ])

      const loadedMonths = (monthData ?? []) as Month[]
      setMonths(loadedMonths)
      setCategories((catData ?? []) as Category[])

      const firstId = loadedMonths[0]?.id ?? null
      setSelectedMonthId(firstId)

      if (firstId) {
        await fetchStats(firstId)
      }

      setReady(true)
    }
    init()
  }, [])

  async function fetchStats(monthId: number) {
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

  async function handleMonthChange(monthId: number) {
    setSelectedMonthId(monthId)
    await fetchStats(monthId)
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const selectedMonth = months.find((m) => m.id === selectedMonthId)

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="px-8 py-5 bg-white border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          {selectedMonth && (
            <p className="text-xs text-zinc-400 mt-0.5 font-medium uppercase tracking-wide">
              {selectedMonth.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Month</span>
          <select
            value={selectedMonthId ?? ''}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            disabled={loading || !ready}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-40 cursor-pointer"
          >
            {!ready && <option value="">Loading…</option>}
            {ready && months.length === 0 && <option value="">No months</option>}
            {months.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`p-8 space-y-8 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Inventory cards */}
        <div className="grid grid-cols-2 gap-4">
          <InventoryCard label="Partner Spots" used={stats.partnerUsed} limit={PARTNER_LIMIT} remaining={stats.partnerRemaining} />
          <InventoryCard label="Cover Sponsors" used={stats.coverUsed} limit={COVER_LIMIT} remaining={stats.coverRemaining} />
        </div>

        {/* Partner Spots table */}
        <section>
          <SectionHeader title="Partner Spots" month={selectedMonth?.name} />
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            {stats.partnerSpots.length === 0 ? (
              <EmptyState text="No partner spots for this month." />
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200">
                  <tr className="bg-zinc-50">
                    {['Company', 'Category', 'Paid', 'Active'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stats.partnerSpots.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-2 font-semibold text-zinc-800 text-[13px]">{s.company_name}</td>
                      <td className="px-4 py-2 text-zinc-500 text-[13px]">{catMap[s.category_id] ?? `#${s.category_id}`}</td>
                      <td className="px-4 py-2"><Badge on={s.paid} yes="Paid" no="Unpaid" /></td>
                      <td className="px-4 py-2"><Badge on={s.active} yes="Active" no="Inactive" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </section>

        {/* Cover Sponsors table */}
        <section>
          <SectionHeader title="Cover Sponsors" month={selectedMonth?.name} />
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            {stats.coverSponsors.length === 0 ? (
              <EmptyState text="No cover sponsors for this month." />
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200">
                  <tr className="bg-zinc-50">
                    {['Company', 'Position', 'Paid', 'Active'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stats.coverSponsors.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-2 font-semibold text-zinc-800 text-[13px]">{s.company_name}</td>
                      <td className="px-4 py-2 text-zinc-500 text-[13px]">{s.position}</td>
                      <td className="px-4 py-2"><Badge on={s.paid} yes="Paid" no="Unpaid" /></td>
                      <td className="px-4 py-2"><Badge on={s.active} yes="Active" no="Inactive" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function InventoryCard({ label, used, limit, remaining }: { label: string; used: number; limit: number; remaining: number }) {
  const pct = Math.round((used / limit) * 100)
  const full = remaining === 0
  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">{label}</p>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-4xl font-black tracking-tight text-zinc-900 leading-none">{used}</span>
        <span className="text-base text-zinc-300 font-semibold leading-none">/ {limit}</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-2.5">
        <div
          className={`h-full rounded-full transition-all ${full ? 'bg-red-500' : 'bg-zinc-800'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs font-semibold ${full ? 'text-red-500' : 'text-zinc-400'}`}>
        {full ? 'No spots remaining' : `${remaining} remaining`}
      </p>
    </div>
  )
}

function SectionHeader({ title, month }: { title: string; month?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <h2 className="text-sm font-bold text-zinc-800">{title}</h2>
      {month && <span className="text-xs text-zinc-400 font-medium">{month}</span>}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-10 text-center text-xs text-zinc-400 font-medium">{text}</p>
}

function Badge({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
      on ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
    }`}>
      {on ? yes : no}
    </span>
  )
}
