import { createClient } from '@supabase/supabase-js'
import ReservationsClient from '../../components/ReservationsClient'

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: reservations }, { data: months }, { data: categories }] = await Promise.all([
    db.from('reservations').select('*').order('created_at', { ascending: false }),
    db.from('months').select('id, name'),
    db.from('categories').select('id, name'),
  ])

  return (
    <ReservationsClient
      reservations={reservations ?? []}
      months={months ?? []}
      categories={categories ?? []}
    />
  )
}
