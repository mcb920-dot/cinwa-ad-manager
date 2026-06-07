import { createClient } from '@supabase/supabase-js'
import MonthsClient from '../../components/MonthsClient'

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

  return <MonthsClient months={months ?? []} />
}
