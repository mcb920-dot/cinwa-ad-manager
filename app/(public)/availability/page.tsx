import { createClient } from '@supabase/supabase-js'
import AvailabilityClient from '../../components/AvailabilityClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Check Availability — CINWA',
  description: 'See which advertising categories are available for the current month.',
}

export default async function AvailabilityPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: months }, { data: categories }] = await Promise.all([
    db.from('months').select('id, name').eq('active', true).order('created_at', { ascending: true }),
    db.from('categories').select('id, name').eq('active', true).order('name'),
  ])

  const allMonths = months ?? []
  const firstMonthId = allMonths[0]?.id ?? null

  let initialData = { partnerUsed: 0, coverUsed: 0, takenCategoryIds: [] as number[] }

  if (firstMonthId) {
    const [partnerCount, paidPartnerCount, coverCount, paidCoverCount, takenSpots, paidTakenSpots] = await Promise.all([
      db.from('partner_spots').select('*', { count: 'exact', head: true }).eq('month_id', firstMonthId).eq('active', true),
      db.from('reservations').select('*', { count: 'exact', head: true }).eq('month_id', firstMonthId).eq('package_type', 'featured_partner').in('status', ['Paid', 'Fulfilled']),
      db.from('cover_sponsors').select('*', { count: 'exact', head: true }).eq('month_id', firstMonthId).eq('active', true),
      db.from('reservations').select('*', { count: 'exact', head: true }).eq('month_id', firstMonthId).eq('package_type', 'cover_sponsor').in('status', ['Paid', 'Fulfilled']),
      db.from('partner_spots').select('category_id').eq('month_id', firstMonthId).eq('active', true),
      db.from('reservations').select('category_id').eq('month_id', firstMonthId).eq('package_type', 'featured_partner').in('status', ['Paid', 'Fulfilled']),
    ])
    initialData = {
      partnerUsed: (partnerCount.count ?? 0) + (paidPartnerCount.count ?? 0),
      coverUsed: (coverCount.count ?? 0) + (paidCoverCount.count ?? 0),
      takenCategoryIds: [
        ...(takenSpots.data?.map((s: { category_id: number }) => s.category_id) ?? []),
        ...(paidTakenSpots.data?.map((r: { category_id: number }) => r.category_id) ?? []),
      ],
    }
  }

  return (
    <AvailabilityClient
      months={allMonths}
      categories={categories ?? []}
      initialMonthId={firstMonthId}
      initialData={initialData}
    />
  )
}
