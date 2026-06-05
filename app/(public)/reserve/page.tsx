import { createClient } from '@supabase/supabase-js'
import ReserveClient from '../../components/ReserveClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reserve a Spot — CINWA',
  description: 'Reserve your advertising spot in the CINWA contractor directory.',
}

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: months }, { data: categories }] = await Promise.all([
    db.from('months').select('id, name').eq('active', true).order('created_at', { ascending: true }),
    db.from('categories').select('id, name').eq('active', true).order('name'),
  ])

  const allMonths = months ?? []
  const params = await searchParams
  const preselectedMonthId = params.month
    ? allMonths.find((m) => String(m.id) === params.month)?.id ?? allMonths[0]?.id ?? null
    : allMonths[0]?.id ?? null

  return (
    <ReserveClient
      months={allMonths}
      categories={categories ?? []}
      initialMonthId={preselectedMonthId}
    />
  )
}
