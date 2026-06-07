import { createClient } from '@supabase/supabase-js'
import CategoriesClient from '../../components/CategoriesClient'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: categories } = await db
    .from('categories')
    .select('*')
    .order('name')

  return <CategoriesClient categories={categories ?? []} />
}
