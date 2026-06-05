import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getPageData() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: months } = await db
    .from('months')
    .select('id, name')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)

  const month = months?.[0] ?? null
  if (!month) return null

  const [partnerCountRes, coverSponsorRes, categoryRes, takenRes] = await Promise.all([
    db.from('partner_spots').select('*', { count: 'exact', head: true }).eq('month_id', month.id).eq('active', true),
    db.from('cover_sponsors').select('id, company_name, position').eq('month_id', month.id).eq('active', true).order('company_name'),
    db.from('categories').select('id, name').eq('active', true).order('name'),
    db.from('partner_spots').select('category_id').eq('month_id', month.id).eq('active', true),
  ])

  const categories = (categoryRes.data ?? []) as { id: number; name: string }[]
  const takenIds   = new Set((takenRes.data ?? []).map((r: { category_id: number }) => r.category_id))

  return {
    month,
    partnerCount:   partnerCountRes.count ?? 0,
    coverSponsors:  (coverSponsorRes.data ?? []) as { id: number; company_name: string; position: string }[],
    available:      categories.filter(c => !takenIds.has(c.id)),
    taken:          categories.filter(c =>  takenIds.has(c.id)),
  }
}

export default async function HomePage() {
  const data = await getPageData()
  const partnerOpen  = 20 - (data?.partnerCount ?? 0)
  const coverCount   = data?.coverSponsors.length ?? 0
  const coverOpen    = 4  - coverCount
  const coverSlots   = Array.from({ length: 4 }, (_, i) => data?.coverSponsors[i] ?? null)

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex items-center overflow-hidden py-28 sm:py-0 sm:h-[680px] lg:h-[750px]">
        {/* Background image */}
        <Image
          src="/logo/hero-photo.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/45" />
        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10">
          <p className="text-red-400 text-xs font-bold uppercase tracking-[0.25em] mb-6">
            Contractors in Northwest Arkansas
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.04] tracking-tight mb-6 max-w-4xl">
            Reach 17,000+ Northwest Arkansas Homeowners &amp; Contractors
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mb-10">
            Exclusive advertising inside the region&apos;s largest contractor community.
            One business per category. Limited monthly placements.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/availability"
              className="px-8 py-3.5 bg-red-700 text-white text-sm font-bold uppercase tracking-widest hover:bg-red-800 transition-colors"
            >
              Check Availability
            </Link>
            <Link
              href="/reserve"
              className="px-8 py-3.5 border border-white/40 text-white text-sm font-bold uppercase tracking-widest hover:border-white hover:bg-white/10 transition-colors"
            >
              Reserve a Spot
            </Link>
          </div>
        </div>
      </section>

      {/* ── COVER SPONSOR ────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200 py-16 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-red-700 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Cover Sponsorship
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-950 leading-tight mb-4">
            This Is What Your Advertisement Looks Like
          </h2>
          <p className="text-zinc-500 text-base leading-relaxed mb-8">
            Premium placement on the most visible asset in the CINWA network — seen by
            17,000+ members across Northwest Arkansas. Only 4 positions available per
            monthly issue.
          </p>

          {/* Cover image */}
          <div className="border border-zinc-200 bg-zinc-50 p-4 mb-10">
            <Image
              src="/logo/NEWJUNECOVERPHOTO.png"
              alt="CINWA Cover Sponsor — Monthly Community Cover"
              width={1731}
              height={909}
              className="w-full h-auto object-contain"
              quality={90}
              priority
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
            {data?.month.name ?? 'Current Month'} — Placements
          </p>
          <div className="divide-y divide-zinc-100 mb-8">
            {coverSlots.map((sponsor, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-300 tabular-nums w-5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {sponsor
                    ? <span className="text-sm font-semibold text-zinc-900">{sponsor.company_name}</span>
                    : <span className="text-sm text-zinc-400 italic">Available</span>
                  }
                </div>
                {!sponsor && (
                  <Link href="/reserve" className="text-xs font-bold uppercase tracking-widest text-red-700 hover:underline">
                    Reserve →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm text-zinc-500 mb-8">
            <p>— Seen by 17,000+ members across Northwest Arkansas</p>
            <p>— Print and digital distribution every month</p>
            <p>— Only 4 sponsors per issue</p>
            <p>— Sold separately from Featured Partner listing</p>
          </div>

          <Link
            href="/reserve"
            className="inline-block px-7 py-3 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Reserve Cover Sponsorship
          </Link>
        </div>
      </section>

      {/* ── MONTHLY DIRECTORY ────────────────────────────────────── */}
      <section className="bg-zinc-950 py-16 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-red-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Monthly Featured Partner Directory
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                See the Actual Monthly Featured Partner List
              </h2>
              <p className="text-zinc-400 text-base mt-3 max-w-xl">
                One company per category. Real businesses. Real placement.
                This goes to 17,000+ members every month.
              </p>
            </div>
            <Link
              href="/availability"
              className="shrink-0 px-6 py-3 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:border-red-700 hover:text-white transition-colors"
            >
              Check Availability
            </Link>
          </div>

          {/* Directory image — contained in a card, max-width 900px, centered */}
          <div className="max-w-[900px] mx-auto border border-zinc-700 bg-zinc-900 p-4">
            <Image
              src="/logo/PRO-JUNE-LIST.png"
              alt="CINWA Monthly Featured Partner Directory — June 2026"
              width={5625}
              height={3750}
              className="w-full h-auto object-contain"
              quality={85}
            />
          </div>

          <p className="text-zinc-500 text-sm mt-6">
            Every listed business is the exclusive representative of their category for the month.
            {partnerOpen > 0 && data
              ? ` ${partnerOpen} spots remain open for ${data.month.name}.`
              : ''}
          </p>
        </div>
      </section>

      {/* ── LIVE AVAILABILITY ────────────────────────────────────── */}
      {data && (
        <section className="bg-white border-t border-zinc-200 py-16 px-6 sm:px-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-red-700 text-xs font-bold uppercase tracking-[0.25em] mb-3">
              Live Inventory
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
              <h2 className="text-3xl font-bold text-zinc-950">Current Availability</h2>
              <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">{data.month.name}</p>
            </div>
            <p className="text-zinc-500 text-base mb-10">
              {partnerOpen} of 20 Featured Partner spots remain open.&nbsp;
              {coverOpen} of 4 Cover Sponsor slots remain open.
            </p>

            {/* Category list — no boxes, just names */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-5">
                Available Categories ({data.available.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6">
                {data.available.map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-2 border-b border-zinc-100 text-sm text-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {data.taken.length > 0 && (
              <div className="mb-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 mb-5">
                  Taken ({data.taken.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6">
                  {data.taken.map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-2 border-b border-zinc-100 text-sm text-zinc-300 line-through">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href="/availability" className="text-xs font-bold uppercase tracking-widest text-red-700 hover:underline">
              View full availability by month →
            </Link>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="bg-red-700 py-20 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-lg">
              Reserve your category before it closes.
            </h2>
            <p className="text-red-200 text-sm mt-3">
              Spots are first-come. When a category fills, it is closed for the month.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/reserve"
              className="px-8 py-4 bg-white text-red-700 text-sm font-bold uppercase tracking-widest text-center hover:bg-zinc-100 transition-colors"
            >
              Reserve a Spot
            </Link>
            <Link
              href="/availability"
              className="px-8 py-4 border-2 border-white text-white text-sm font-bold uppercase tracking-widest text-center hover:bg-red-800 transition-colors"
            >
              Check Availability
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
