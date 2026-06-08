'use client'
import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export type Category = { id: number; name: string; active: boolean }

const INPUT = 'w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white'

const EMPTY_FORM = { name: '', active: true }

export default function CategoriesClient({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories]   = useState<Category[]>(initial)
  const [open, setOpen]               = useState(false)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setOpen(true)
  }

  function openEdit(c: Category) {
    setEditingId(c.id)
    setForm({ name: c.name, active: c.active })
    setError(null)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setError(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (editingId !== null) {
      const { data, error: err } = await supabase
        .from('categories')
        .update({ name: form.name, active: form.active })
        .eq('id', editingId)
        .select()
      setLoading(false)
      if (err) { setError(err.message); return }
      if (data) setCategories((prev) => prev.map((c) => c.id === editingId ? { ...c, ...data[0] } : c))
    } else {
      const { data, error: err } = await supabase
        .from('categories')
        .insert([{ name: form.name, active: form.active }])
        .select()
      setLoading(false)
      if (err) { setError(err.message); return }
      if (data) setCategories((prev) => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
    }
    closeModal()
  }

  async function handleToggleActive(c: Category) {
    const { data, error: err } = await supabase
      .from('categories')
      .update({ active: !c.active })
      .eq('id', c.id)
      .select()
    if (!err && data) setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !c.active } : x))
  }

  async function handleDelete(id: number) {
    setLoading(true)
    const { error: err } = await supabase.from('categories').delete().eq('id', id)
    setLoading(false)
    if (err) { setError(err.message); return }
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <>
      <div className="px-8 py-5 bg-white border-b border-zinc-200 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Categories</h1>
        <button onClick={openAdd} className="px-4 py-1.5 bg-red-600 text-white text-[13px] font-semibold rounded-md hover:bg-red-700 transition-colors">
          Add Category
        </button>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {categories.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-400 font-medium">No categories yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200">
                <tr className="bg-zinc-50">
                  {['Name', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-4 py-2 font-semibold text-zinc-800 text-[13px]">{c.name}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          c.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                        }`}
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                        Edit
                      </button>
                      <span className="text-zinc-200">|</span>
                      <button onClick={() => setConfirmDeleteId(c.id)} className="text-xs font-semibold text-red-400 hover:text-red-700 transition-colors">
                        Delete
                      </button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Roofing"
                  className={INPUT}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded accent-red-600" />
                Active
              </label>
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
            <h3 className="text-base font-bold text-zinc-900 mb-2">Delete this category?</h3>
            <p className="text-sm text-zinc-500 mb-6">This cannot be undone. Partner spots linked to this category will lose their category reference.</p>
            {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-1.5 text-[13px] font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600">Cancel</button>
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
