import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: categories } = await db
    .from('categories')
    .select('*')
    .order('name')

  return (
    <>
      <div className="px-8 py-5 bg-white border-b border-zinc-200">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Categories</h1>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {!categories || categories.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-400 font-medium">No categories yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200">
                <tr className="bg-zinc-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-4 py-2 text-[13px] font-semibold text-zinc-800">{c.name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
