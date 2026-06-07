'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

const STATUSES = ['New', 'Contacted', 'Approved', 'Payment Sent', 'Paid', 'Declined'] as const
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
type Props = { reservations: Reservation[]; months: LookupItem[]; categories: LookupItem[] }

const STATUS_STYLES: Record<Status, string> = {
  New:             'bg-red-600 text-white',
  Contacted:       'bg-amber-500 text-black',
  Approved:        'bg-blue-600 text-white',
  'Payment Sent':  'bg-indigo-600 text-white',
  Paid:            'bg-emerald-600 text-white',
  Declined:        'bg-zinc-500 text-white',
}

const ROW_TINT: Partial<Record<Status, string>> = {
  New:      'bg-red-50/50',
  Approved: 'bg-blue-50/30',
  Paid:     'bg-emerald-50/30',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReservationsClient({ reservations: initial, months, categories }: Props) {
  const [rows, setRows]             = useState<Reservation[]>(initial)
  const [processing, setProcessing] = useState<number | null>(null)
  const [rowErrors, setRowErrors]   = useState<Record<number, string>>({})

  const monthMap = Object.fromEntries(months.map((m) => [m.id, m.name]))
  const catMap   = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const newCount = rows.filter((r) => r.status === 'New').length

  function setError(id: number, msg: string) {
    setRowErrors((prev) => ({ ...prev, [id]: msg }))
  }
  function clearError(id: number) {
    setRowErrors((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  async function handleStatusChange(id: number, status: Status) {
    setProcessing(id)
    clearError(id)
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) {
      setError(id, error.message || 'Update failed — check Supabase permissions.')
    } else {
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    }
    setProcessing(null)
  }

  async function handleApprove(id: number) {
    await handleStatusChange(id, 'Approved')
  }

  async function handleMarkPaid(r: Reservation) {
    setProcessing(r.id)
    clearError(r.id)

    // 1. Create the inventory record first
    let createErr: string | null = null

    if (r.package_type === 'featured_partner') {
      const { error } = await supabase.from('partner_spots').insert([{
        month_id:     r.month_id,
        category_id:  r.category_id,
        company_name: r.company_name,
        contact_name: r.contact_name ?? '',
        email:        r.email,
        phone:        r.phone ?? '',
        website:      r.website ?? '',
        facebook_url: r.facebook_url ?? '',
        paid:         true,
        active:       true,
      }])
      if (error) {
        createErr = error.code === '23505'
          ? 'Category already taken for this month. Remove the duplicate in Partner Spots first.'
          : (error.message || 'Failed to create partner spot — check Supabase permissions.')
      }
    } else if (r.package_type === 'cover_sponsor') {
      const { error } = await supabase.from('cover_sponsors').insert([{
        month_id:     r.month_id,
        company_name: r.company_name,
        position:     '',
        paid:         true,
        active:       true,
      }])
      if (error) {
        createErr = error.message || 'Failed to create cover sponsor — check Supabase permissions.'
      }
    }

    if (createErr) {
      setError(r.id, createErr)
      setProcessing(null)
      return
    }

    // 2. Mark reservation Paid only after record created successfully
    const { error: statusErr } = await supabase
      .from('reservations')
      .update({ status: 'Paid' })
      .eq('id', r.id)

    if (statusErr) {
      setError(r.id, statusErr.message || 'Record created but status update failed.')
    } else {
      setRows((prev) => prev.map((row) => row.id === r.id ? { ...row, status: 'Paid' } : row))
    }
    setProcessing(null)
  }

  const pkgLabel = (raw: string) =>
    raw === 'featured_partner' ? 'Featured Partner' : raw === 'cover_sponsor' ? 'Cover Sponsor' : raw

  const COLS = ['Status', 'Actions', 'Company', 'Contact', 'Email', 'Phone', 'Month', 'Package', 'Category', 'Message', 'Submitted']

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
                    {COLS.map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => {
                    const busy        = processing === r.id
                    const canApprove  = r.status === 'New' || r.status === 'Contacted'
                    const canMarkPaid = r.status === 'Approved' || r.status === 'Payment Sent'
                    return (
                      <tr key={r.id} className={`transition-colors ${ROW_TINT[r.status] ?? ''}`}>

                        {/* Status dropdown */}
                        <td className="px-4 py-3 align-top">
                          <select
                            value={r.status}
                            disabled={busy}
                            onChange={(e) => handleStatusChange(r.id, e.target.value as Status)}
                            className={`text-[11px] font-bold rounded px-2 py-1 border-0 cursor-pointer disabled:opacity-50 ${STATUS_STYLES[r.status]}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s} className="bg-white text-zinc-900">{s}</option>
                            ))}
                          </select>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1.5 min-w-[120px]">
                            {canApprove && (
                              <button
                                disabled={busy}
                                onClick={() => handleApprove(r.id)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wide rounded hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                              >
                                {busy ? '…' : 'Approve'}
                              </button>
                            )}
                            {canMarkPaid && (
                              <button
                                disabled={busy}
                                onClick={() => handleMarkPaid(r)}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wide rounded hover:bg-emerald-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                              >
                                {busy ? 'Creating…' : 'Mark Paid'}
                              </button>
                            )}
                            {r.status === 'Paid' && (
                              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide whitespace-nowrap">
                                ✓ Record created
                              </span>
                            )}
                            {rowErrors[r.id] && (
                              <p className="text-[11px] text-red-600 max-w-[180px] leading-snug mt-1">
                                ⚠ {rowErrors[r.id]}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-zinc-800 whitespace-nowrap align-top">{r.company_name}</td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap align-top">{r.contact_name ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap align-top">
                          <a href={`mailto:${r.email}`} className="hover:text-zinc-900 underline underline-offset-2">{r.email}</a>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap align-top">{r.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap align-top">
                          {r.month_id ? (monthMap[r.month_id] ?? `#${r.month_id}`) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${r.package_type === 'featured_partner' ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-800 text-zinc-200'}`}>
                            {pkgLabel(r.package_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap align-top">
                          {r.category_id ? (catMap[r.category_id] ?? `#${r.category_id}`) : '—'}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 align-top max-w-[200px]">
                          <span className="line-clamp-3 text-xs leading-relaxed">{r.message ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap align-top text-xs">{fmt(r.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
