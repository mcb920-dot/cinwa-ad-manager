import { createClient } from '@supabase/supabase-js'
import AdminShell from '../components/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let newReservationCount = 0
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count } = await db
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'New')
    newReservationCount = count ?? 0
  } catch {
    // reservations table may not exist yet — degrade gracefully
  }

  return <AdminShell newReservationCount={newReservationCount}>{children}</AdminShell>
}
