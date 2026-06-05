import { createClient } from '@supabase/supabase-js'
import DashboardClient from '../components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const query = `supabase.from('months').select('*').eq('active', true).order('start_date', { ascending: true })`

  let data: unknown = undefined
  let error: unknown = undefined
  let count: number | null = null

  if (url && key) {
    const db = createClient(url, key)
    const result = await db
      .from('months')
      .select('*')
      .eq('active', true)
      .order('start_date', { ascending: true })

    data = result.data
    error = result.error
    count = Array.isArray(result.data) ? result.data.length : null
  }

  return (
    <div>
      {/* ── DEBUG PANEL ── remove once months are working */}
      <div className="m-6 rounded-lg border border-zinc-300 bg-zinc-50 font-mono text-xs overflow-hidden">
        <div className="px-4 py-2 bg-zinc-200 font-bold text-zinc-700 uppercase tracking-widest text-[10px]">
          Supabase Debug — remove when fixed
        </div>
        <div className="p-4 space-y-2">
          <Row label="NEXT_PUBLIC_SUPABASE_URL exists" value={url ? 'YES' : 'NO'} ok={!!url} />
          <Row label="URL length" value={url ? String(url.length) : 'n/a'} />
          <Row label="URL startsWith https://" value={url ? String(url.startsWith('https://')) : 'n/a'} ok={url?.startsWith('https://')} />
          <Row label="URL endsWith .supabase.co" value={url ? String(url.endsWith('.supabase.co')) : 'n/a'} ok={url?.endsWith('.supabase.co')} />
          <Row label="URL contains /rest/v1" value={url ? String(url.includes('/rest/v1')) : 'n/a'} />
          <Row label="URL contains spaces" value={url ? String(url.includes(' ')) : 'n/a'} ok={url ? !url.includes(' ') : undefined} />
          <Row label="URL first 20 chars" value={url ? url.slice(0, 20) : 'n/a'} />
          <Row label="URL last 20 chars" value={url ? url.slice(-20) : 'n/a'} />
          <div className="pt-1 border-t border-zinc-200" />
          <Row label="NEXT_PUBLIC_SUPABASE_ANON_KEY exists" value={key ? 'YES' : 'NO'} ok={!!key} />
          <div className="pt-1 border-t border-zinc-200" />
          <Row label="Query" value={query} />
          <Row label="Months returned (count)" value={count === null ? 'null (query did not run or data is null)' : String(count)} ok={count !== null && count > 0} />
          <Row
            label="Error"
            value={error ? JSON.stringify(error, null, 2) : 'none'}
            ok={!error}
            red={!!error}
          />
          {data !== undefined && (
            <div>
              <span className="text-zinc-500">Raw data: </span>
              <pre className="mt-1 whitespace-pre-wrap break-all text-zinc-800 bg-white border border-zinc-200 rounded p-2">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <DashboardClient />
    </div>
  )
}

function Row({
  label,
  value,
  ok,
  red,
}: {
  label: string
  value: string
  ok?: boolean
  red?: boolean
}) {
  const valueColor =
    red ? 'text-red-600 font-semibold' :
    ok === true ? 'text-emerald-700 font-semibold' :
    ok === false ? 'text-red-600 font-semibold' :
    'text-zinc-700'

  return (
    <div className="flex gap-3">
      <span className="text-zinc-400 shrink-0 w-64">{label}:</span>
      <span className={valueColor}>{value}</span>
    </div>
  )
}
