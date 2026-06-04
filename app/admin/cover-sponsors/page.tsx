import { createClient } from '@supabase/supabase-js'
import CoverSponsorsClient from '../../components/CoverSponsorsClient'

export const dynamic = 'force-dynamic'

export default async function CoverSponsorsPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [{ data: sponsors }, { data: months }] = await Promise.all([
    db.from('cover_sponsors').select('*').order('created_at', { ascending: false }),
    db.from('months').select('id, name').order('created_at', { ascending: true }),
  ])
  return (
    <CoverSponsorsClient
      sponsors={sponsors ?? []}
      months={months ?? []}
    />
  )
}
