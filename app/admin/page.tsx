import { createClient } from '@supabase/supabase-js'
import DashboardClient, { type MonthStats } from '../components/DashboardClient'

export const dynamic = 'force-dynamic'

const PARTNER_LIMIT = 20
const COVER_LIMIT = 4

export default async function Dashboard() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: months }, { data: categories }] = await Promise.all([
    db.from('months').select('id, name, active').order('created_at', { ascending: true }),
    db.from('categories').select('id, name').order('name'),
  ])

  const allMonths = months ?? []
  const firstActive = allMonths.find((m) => m.active) ?? null
  const initialMonthId = firstActive?.id ?? null

  const EMPTY: MonthStats = {
    partnerUsed: 0,
    partnerRemaining: PARTNER_LIMIT,
    coverUsed: 0,
    coverRemaining: COVER_LIMIT,
    partnerSpots: [],
    coverSponsors: [],
  }

  if (!initialMonthId) {
    return (
      <DashboardClient
        months={allMonths}
        categories={categories ?? []}
        initialMonthId={null}
        initialStats={EMPTY}
      />
    )
  }

  const [partnerCount, coverCount, partnerList, coverList] = await Promise.all([
    db.from('partner_spots').select('*', { count: 'exact', head: true }).eq('month_id', initialMonthId).eq('active', true),
    db.from('cover_sponsors').select('*', { count: 'exact', head: true }).eq('month_id', initialMonthId).eq('active', true),
    db.from('partner_spots').select('id, company_name, category_id, paid, active').eq('month_id', initialMonthId).order('company_name'),
    db.from('cover_sponsors').select('id, company_name, position, paid, active').eq('month_id', initialMonthId).order('company_name'),
  ])

  const partnerUsed = partnerCount.count ?? 0
  const coverUsed = coverCount.count ?? 0

  const initialStats: MonthStats = {
    partnerUsed,
    partnerRemaining: Math.max(0, PARTNER_LIMIT - partnerUsed),
    coverUsed,
    coverRemaining: Math.max(0, COVER_LIMIT - coverUsed),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    partnerSpots: (partnerList.data ?? []) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coverSponsors: (coverList.data ?? []) as any,
  }

  return (
    <DashboardClient
      months={allMonths}
      categories={categories ?? []}
      initialMonthId={initialMonthId}
      initialStats={initialStats}
    />
  )
}
