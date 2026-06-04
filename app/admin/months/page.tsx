import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function MonthsPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: months } = await db
    .from('months')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <>
      <div className="px-8 py-5 border-b border-zinc-200 bg-white">
        <h1 className="text-lg font-semibold text-zinc-900">Months</h1>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {!months || months.length === 0 ? (
            <p className="p-10 text-center text-sm text-zinc-400">No months yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {months.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        m.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {m.active ? 'Active' : 'Inactive'}
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
