'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import type { Month } from './PartnerSpotsClient'

export type CoverSponsor = {
  id: number
  month_id: number
  company_name: string
  position: string
  paid: boolean
  active: boolean
}

type Props = { sponsors: CoverSponsor[]; months: Month[] }

const EMPTY = {
  month_id: '',
  company_name: '',
  position: '',
  paid: false,
  active: true,
}

const INPUT = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white'
const COLS = ['Month', 'Company', 'Position', 'Paid', 'Active']

export default function CoverSponsorsClient({ sponsors: initial, months }: Props) {
  const [sponsors, setSponsors] = useState(initial)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthMap = Object.fromEntries(months.map((m) => [m.id, m.name]))

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function closeModal() {
    setOpen(false)
    setError(null)
    setForm(EMPTY)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('cover_sponsors')
      .insert([{ ...form, month_id: Number(form.month_id) }])
      .select()
    setLoading(false)
    if (err) { setError(err.message); return }
    if (data) setSponsors((prev) => [data[0], ...prev])
    closeModal()
  }

  return (
    <>
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-zinc-200 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Cover Sponsors</h1>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-1.5 bg-red-600 text-white text-[13px] font-semibold rounded-md hover:bg-red-700 transition-colors"
        >
          Add Cover Sponsor
        </button>
      </div>

      {/* Table */}
      <div className="p-8">
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {sponsors.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-400 font-medium">No cover sponsors yet.</p>
          ) : (
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
                  {sponsors.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{monthMap[s.month_id] ?? s.month_id}</td>
                      <td className="px-4 py-2 text-[13px] font-semibold text-zinc-800 whitespace-nowrap">{s.company_name}</td>
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{s.position}</td>
                      <td className="px-4 py-2"><Badge on={s.paid} yes="Paid" no="Unpaid" /></td>
                      <td className="px-4 py-2"><Badge on={s.active} yes="Active" no="Inactive" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">Add Cover Sponsor</h2>
              <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <Label text="Month" required />
                <select value={form.month_id} onChange={(e) => set('month_id', e.target.value)} required className={INPUT}>
                  <option value="">Select month</option>
                  {months.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <Label text="Company Name" required />
                <input type="text" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} required className={INPUT} />
              </div>
              <div>
                <Label text="Position" />
                <input type="text" value={form.position} onChange={(e) => set('position', e.target.value)} className={INPUT} placeholder="e.g. Front Cover, Back Cover" />
              </div>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" checked={form.paid} onChange={(e) => set('paid', e.target.checked)} className="w-4 h-4 rounded accent-red-600" />
                  Paid
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 rounded accent-red-600" />
                  Active
                </label>
              </div>
              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button type="button" onClick={closeModal} className="px-4 py-1.5 text-[13px] font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 text-[13px] font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
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

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
