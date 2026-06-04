import { createClient } from '@supabase/supabase-js'
import PartnerSpotsClient from '../../components/PartnerSpotsClient'

export const dynamic = 'force-dynamic'

export default async function PartnerSpotsPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [{ data: spots }, { data: months }, { data: categories }] = await Promise.all([
    db.from('partner_spots').select('*').order('created_at', { ascending: false }),
    db.from('months').select('id, name').order('created_at', { ascending: true }),
    db.from('categories').select('id, name').order('name'),
  ])
  return (
    <PartnerSpotsClient
      spots={spots ?? []}
      months={months ?? []}
      categories={categories ?? []}
    />
  )
}
