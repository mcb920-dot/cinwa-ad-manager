'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

const STATUSES = ['New', 'Contacted', 'Approved', 'Declined'] as const
type Status = typeof STATUSES[number]

export type Reservation = {
  id: number
  created_at: string
  company_name: string
  contact_name: string | null
  email: string
  phone: string | null
  month_id: number | null
  category_id: number | null
  package_type: string
  website: string | null
  facebook_url: string | null
  message: string | null
  status: Status
}

type LookupItem = { id: number; name: string }

type Props = {
  reservations: Reservation[]
  months: LookupItem[]
  categories: LookupItem[]
}

const STATUS_STYLES: Record<Status, string> = {
  New:       'bg-red-600 text-white',
  Contacted: 'bg-amber-500 text-black',
  Approved:  'bg-emerald-600 text-white',
  Declined:  'bg-zinc-600 text-white',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReservationsClient({ reservations: initial, months, categories }: Props) {
  const [rows, setRows]       = useState<Reservation[]>(initial)
  const [updating, setUpdating] = useState<number | null>(null)

  const monthMap = Object.fromEntries(months.map((m) => [m.id, m.name]))
  const catMap   = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const newCount = rows.filter((r) => r.status === 'New').length

  async function handleStatusChange(id: number, status: Status) {
    setUpdating(id)
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (!error) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    }
    setUpdating(null)
  }

  const packageLabel = (raw: string) =>
    raw === 'featured_partner' ? 'Featured Partner' : raw === 'cover_sponsor' ? 'Cover Sponsor' : raw

  return (
    <>
      <div className="px-8 py-5 bg-white border-b border-zinc-200 flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Reservations</h1>
        {newCount > 0 && (
          <span className="text-[11px] font-black uppercase tracking-widest bg-red-600 text-white px-2.5 py-1 rounded-full">
            {newCount} New
          </span>
        )}
      </div>

      <div className="p-8">
        {rows.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-lg py-16 text-center">
            <p className="text-xs text-zinc-400 font-medium">No reservation requests yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200">
                  <tr className="bg-zinc-50">
                    {['Status', 'Company', 'Contact', 'Email', 'Phone', 'Month', 'Package', 'Category', 'Website', 'Facebook', 'Message', 'Submitted'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => (
                    <tr key={r.id} className={`hover:bg-zinc-50/70 transition-colors ${r.status === 'New' ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-2">
                        <select
                          value={r.status}
                          disabled={updating === r.id}
                          onChange={(e) => handleStatusChange(r.id, e.target.value as Status)}
                          className={`text-[11px] font-bold rounded px-2 py-1 border-0 cursor-pointer disabled:opacity-50 ${STATUS_STYLES[r.status]}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-zinc-900">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 font-semibold text-zinc-800 whitespace-nowrap">{r.company_name}</td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{r.contact_name ?? '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">
                        <a href={`mailto:${r.email}`} className="hover:text-zinc-900 underline underline-offset-2">{r.email}</a>
                      </td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{r.phone ?? '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{r.month_id ? (monthMap[r.month_id] ?? r.month_id) : '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{packageLabel(r.package_type)}</td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{r.category_id ? (catMap[r.category_id] ?? '—') : '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap max-w-[140px] truncate">
                        {r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="hover:text-zinc-900 underline underline-offset-2">{r.website}</a> : '—'}
                      </td>
                      <td className="px-4 py-2 text-zinc-500 whitespace-nowrap max-w-[140px] truncate">
                        {r.facebook_url ? <a href={r.facebook_url} target="_blank" rel="noreferrer" className="hover:text-zinc-900 underline underline-offset-2">{r.facebook_url}</a> : '—'}
                      </td>
                      <td className="px-4 py-2 text-zinc-500 max-w-[200px]">
                        <span className="line-clamp-2 text-xs">{r.message ?? '—'}</span>
                      </td>
                      <td className="px-4 py-2 text-zinc-400 whitespace-nowrap text-xs">{fmt(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
