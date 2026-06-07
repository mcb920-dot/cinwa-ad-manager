'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export type Month    = { id: number; name: string }
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
  month_id: '', category_id: '', company_name: '', contact_name: '',
  email: '', phone: '', website: '', facebook_url: '', paid: false, active: true,
}
const INPUT = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white'
const COLS  = ['Month', 'Category', 'Company', 'Contact', 'Email', 'Phone', 'Paid', 'Active', 'Actions']

export default function PartnerSpotsClient({ spots: initial, months, categories }: Props) {
  const [spots, setSpots]             = useState<PartnerSpot[]>(initial)
  const [open, setOpen]               = useState(false)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [form, setForm]               = useState({ ...EMPTY })
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const monthMap = Object.fromEntries(months.map((m) => [m.id, m.name]))
  const catMap   = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setError(null)
    setOpen(true)
  }

  function openEdit(spot: PartnerSpot) {
    setEditingId(spot.id)
    setForm({
      month_id: String(spot.month_id), category_id: String(spot.category_id),
      company_name: spot.company_name, contact_name: spot.contact_name ?? '',
      email: spot.email ?? '', phone: spot.phone ?? '',
      website: spot.website ?? '', facebook_url: spot.facebook_url ?? '',
      paid: spot.paid, active: spot.active,
    })
    setError(null)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setError(null)
    setForm({ ...EMPTY })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const monthId    = Number(form.month_id)
    const categoryId = Number(form.category_id)
    const payload    = { ...form, month_id: monthId, category_id: categoryId }

    if (editingId !== null) {
      const { data, error: err } = await supabase.from('partner_spots').update(payload).eq('id', editingId).select()
      setLoading(false)
      if (err) { setError(err.code === '23505' ? 'This category is already taken for this month.' : err.message); return }
      if (data) setSpots((prev) => prev.map((s) => s.id === editingId ? { ...s, ...data[0] } : s))
    } else {
      const { count } = await supabase.from('partner_spots').select('*', { count: 'exact', head: true }).eq('month_id', monthId).eq('active', true)
      if ((count ?? 0) >= 20) { setError('This month is full.'); setLoading(false); return }
      const { data, error: err } = await supabase.from('partner_spots').insert([payload]).select()
      setLoading(false)
      if (err) { setError(err.code === '23505' ? 'This category is already taken for this month.' : err.message); return }
      if (data) setSpots((prev) => [data[0], ...prev])
    }
    closeModal()
  }

  async function handleDelete(id: number) {
    setLoading(true)
    const { error: err } = await supabase.from('partner_spots').delete().eq('id', id)
    setLoading(false)
    if (err) { setError(err.message); return }
    setSpots((prev) => prev.filter((s) => s.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <>
      <div className="px-8 py-5 bg-white border-b border-zinc-200 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Partner Spots</h1>
        <button onClick={openAdd} className="px-4 py-1.5 bg-red-600 text-white text-[13px] font-semibold rounded-md hover:bg-red-700 transition-colors">
          Add Partner Spot
        </button>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {spots.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-400 font-medium">No partner spots yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200">
                  <tr className="bg-zinc-50">
                    {COLS.map((h) => <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {spots.map((spot) => (
                    <tr key={spot.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{monthMap[spot.month_id] ?? spot.month_id}</td>
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{catMap[spot.category_id] ?? spot.category_id}</td>
                      <td className="px-4 py-2 text-[13px] font-semibold text-zinc-800 whitespace-nowrap">{spot.company_name}</td>
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{spot.contact_name}</td>
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{spot.email}</td>
                      <td className="px-4 py-2 text-[13px] text-zinc-500 whitespace-nowrap">{spot.phone}</td>
                      <td className="px-4 py-2"><Badge on={spot.paid} yes="Paid" no="Unpaid" /></td>
                      <td className="px-4 py-2"><Badge on={spot.active} yes="Active" no="Inactive" /></td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <button onClick={() => openEdit(spot)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors whitespace-nowrap">Edit</button>
                        <span className="text-zinc-200">|</span>
                        <button onClick={() => setConfirmDeleteId(spot.id)} className="text-xs font-semibold text-red-400 hover:text-red-700 transition-colors whitespace-nowrap">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">{editingId ? 'Edit Partner Spot' : 'Add Partner Spot'}</h2>
              <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors text-lg leading-none">×</button>
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
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" checked={form.paid} onChange={(e) => set('paid', e.target.checked)} className="w-4 h-4 rounded accent-red-600" /> Paid
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 rounded accent-red-600" /> Active
                </label>
              </div>
              {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button type="button" onClick={closeModal} className="px-4 py-1.5 text-[13px] font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 text-[13px] font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-zinc-900 mb-2">Delete this partner spot?</h3>
            <p className="text-sm text-zinc-500 mb-6">This cannot be undone.</p>
            {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmDeleteId(null); setError(null) }} className="px-4 py-1.5 text-[13px] font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={loading} className="px-4 py-1.5 text-[13px] font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Badge({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>
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
