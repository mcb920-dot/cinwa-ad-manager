'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export type Month = { id: number; name: string }
export type Category = { id: number; name: string }
export type PartnerSpot = {
  id: number
  month_id: number
  category_id: number
  company_name: string
  contact_name: string
  email: string
  phone: string
  website: string
  facebook_url: string
  paid: boolean
  active: boolean
}

type Props = { spots: PartnerSpot[]; months: Month[]; categories: Category[] }

const EMPTY = {
  month_id: '',
  category_id: '',
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  website: '',
  facebook_url: '',
  paid: false,
  active: true,
}

const INPUT = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const COLS = ['Month', 'Category', 'Company', 'Contact', 'Email', 'Phone', 'Paid', 'Active']

export default function PartnerSpotsClient({ spots: initial, months, categories }: Props) {
  const [spots, setSpots] = useState(initial)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthMap = Object.fromEntries(months.map((m) => [m.id, m.name]))
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

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

    const monthId = Number(form.month_id)

    const { count } = await supabase
      .from('partner_spots')
      .select('*', { count: 'exact', head: true })
      .eq('month_id', monthId)
      .eq('active', true)

    if ((count ?? 0) >= 20) {
      setError('This month is full. Please choose another month.')
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase
      .from('partner_spots')
      .insert([{ ...form, month_id: monthId, category_id: Number(form.category_id) }])
      .select()
    setLoading(false)
    if (err) {
      setError(
        err.message.includes('monthly_spot_limit_exceeded')
          ? 'This month is full. Please choose another month.'
          : err.code === '23505'
          ? 'This category is already taken for this month.'
          : err.message
      )
      return
    }
    if (data) setSpots((prev) => [data[0], ...prev])
    closeModal()
  }

  return (
    <>
      <div className="px-8 py-5 border-b border-zinc-200 bg-white flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Partner Spots</h1>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Partner Spot
        </button>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {spots.length === 0 ? (
            <p className="p-10 text-center text-sm text-zinc-400">No partner spots yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    {COLS.map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {spots.map((spot) => (
                    <tr key={spot.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{monthMap[spot.month_id] ?? spot.month_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{catMap[spot.category_id] ?? spot.category_id}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{spot.company_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{spot.contact_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{spot.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{spot.phone}</td>
                      <td className="px-4 py-3"><Badge on={spot.paid} yes="Paid" no="Unpaid" /></td>
                      <td className="px-4 py-3"><Badge on={spot.active} yes="Active" no="Inactive" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">Add Partner Spot</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Month" required />
                  <select value={form.month_id} onChange={(e) => set('month_id', e.target.value)} required className={INPUT}>
                    <option value="">Select month</option>
                    {months.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label text="Category" required />
                  <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required className={INPUT}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label text="Company Name" required />
                <input type="text" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} required className={INPUT} />
              </div>
              <div>
                <Label text="Contact Name" />
                <input type="text" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Email" />
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={INPUT} />
                </div>
                <div>
                  <Label text="Phone" />
                  <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={INPUT} />
                </div>
              </div>
              <div>
                <Label text="Website" />
                <input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} className={INPUT} />
              </div>
              <div>
                <Label text="Facebook URL" />
                <input type="text" value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} className={INPUT} />
              </div>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input type="checkbox" checked={form.paid} onChange={(e) => set('paid', e.target.checked)} className="w-4 h-4 rounded" />
                  Paid
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 rounded" />
                  Active
                </label>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      on ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
    }`}>
      {on ? yes : no}
    </span>
  )
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-zinc-700 mb-1">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
