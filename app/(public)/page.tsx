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
  const partnerOpen = 20 - (data?.partnerCount ?? 0)
  const coverOpen   = 4  - (data?.coverSponsors.length ?? 0)
  const coverSlots  = Array.from({ length: 4 }, (_, i) => data?.coverSponsors[i] ?? null)

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex items-center overflow-hidden py-28 sm:py-0 sm:h-[680px] lg:h-[750px]">
        <Image
          src="/logo/Hero-photo.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-black/45" />
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
            <Link href="/availability" className="px-8 py-3.5 bg-red-700 text-white text-sm font-bold uppercase tracking-widest hover:bg-red-800 transition-colors">
              Check Availability
            </Link>
            <Link href="/reserve" className="px-8 py-3.5 border border-white/40 text-white text-sm font-bold uppercase tracking-widest hover:border-white hover:bg-white/10 transition-colors">
              Reserve a Spot
            </Link>
          </div>
        </div>
      </section>

      {/* ── COVER SPONSORSHIP ────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200 py-20 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">

          {/* Eyebrow */}
          <p className="text-red-700 text-xs font-black uppercase tracking-[0.3em] mb-3">
            Be Seen. Every Time.
          </p>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-950 leading-tight tracking-tight mb-5">
            Your Business. Front and Center. All Month Long.
          </h2>

          {/* Supporting copy */}
          <p className="text-zinc-500 text-base leading-relaxed mb-2">
            Think of it as a digital billboard inside one of Northwest Arkansas&apos; most active
            contractor communities. Your business is displayed on the group&apos;s cover photo —
            the first thing members see when visiting the page.
          </p>
          <p className="text-zinc-500 text-base leading-relaxed mb-10">
            Only four positions are available each month.
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

          {/* Premium inventory cards */}
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-4">
            {data?.month.name ?? 'Current Month'} — Cover Positions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {coverSlots.map((sponsor, i) => (
              sponsor ? (
                <div key={i} className="bg-zinc-950 border border-zinc-800 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
                    Position {String(i + 1).padStart(2, '0')}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold text-sm">{sponsor.company_name}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-800 px-2 py-0.5">
                      Reserved
                    </span>
                  </div>
                </div>
              ) : (
                <div key={i} className="border border-dashed border-zinc-300 bg-zinc-50 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                      Position {String(i + 1).padStart(2, '0')}
                    </p>
                    <p className="text-sm font-bold text-red-700">Available</p>
                  </div>
                  <Link
                    href="/reserve"
                    className="text-[11px] font-black uppercase tracking-widest text-white bg-red-700 px-4 py-2 hover:bg-red-800 transition-colors shrink-0"
                  >
                    Reserve →
                  </Link>
                </div>
              )
            ))}
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
      <section className="bg-zinc-950 py-20 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">

          {/* Eyebrow */}
          <p className="text-red-600 text-xs font-black uppercase tracking-[0.3em] mb-4">
            Monthly Featured Partner Directory
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-2xl">
                Connecting Homeowners With Trusted Local Professionals
              </h2>
              <p className="text-zinc-400 text-base mt-4 max-w-2xl leading-relaxed">
                One company per category. Real businesses. Real relationships. Building a stronger
                contractor community across Northwest Arkansas while helping homeowners connect
                with local professionals they can trust.
              </p>
            </div>
            <Link
              href="/availability"
              className="shrink-0 px-6 py-3 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:border-red-700 hover:text-white transition-colors"
            >
              Check Availability
            </Link>
          </div>

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
            {partnerOpen > 0 && data ? ` ${partnerOpen} spots remain open for ${data.month.name}.` : ''}
          </p>
        </div>
      </section>

      {/* ── WHY CINWA ────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-10 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto">

          {/* Eyebrow */}
          <p className="text-red-700 text-xs font-black uppercase tracking-[0.3em] mb-4">
            Why CINWA
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-950 leading-tight tracking-tight mb-6 max-w-3xl">
            More Than Advertising. A Network Built for Northwest Arkansas.
          </h2>

          <div className="max-w-3xl mb-14 space-y-4">
            <p className="text-zinc-500 text-base leading-relaxed">
              Contractors in Northwest Arkansas was created to strengthen the connection between
              homeowners and local professionals. What started as a Facebook community has grown
              into a trusted network where homeowners discover reliable contractors and businesses
              gain visibility, credibility, and opportunities to grow.
            </p>
            <p className="text-zinc-500 text-base leading-relaxed">
              With more than 17,000 members and growing, CINWA is focused on supporting local
              businesses, encouraging professional relationships, and helping homeowners make
              confident decisions when hiring contractors.
            </p>
          </div>

          {/* Pillar cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-7 border border-zinc-800">
              <div className="w-8 h-0.5 bg-red-600 mb-5" />
              <h3 className="text-white font-bold text-base mb-3 leading-snug">
                Trusted Local Professionals
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect with established businesses serving Northwest Arkansas homeowners every day.
              </p>
            </div>
            <div className="bg-zinc-950 p-7 border border-zinc-800">
              <div className="w-8 h-0.5 bg-red-600 mb-5" />
              <h3 className="text-white font-bold text-base mb-3 leading-snug">
                Visibility That Matters
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Get your business in front of an engaged audience actively seeking local services.
              </p>
            </div>
            <div className="bg-zinc-950 p-7 border border-zinc-800">
              <div className="w-8 h-0.5 bg-red-600 mb-5" />
              <h3 className="text-white font-bold text-base mb-3 leading-snug">
                Built on Community
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Strengthening relationships between contractors, homeowners, suppliers, and local businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE AVAILABILITY ────────────────────────────────────── */}
      {data && (
        <section className="bg-white py-16 px-6 sm:px-10">
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
            <Link href="/reserve" className="px-8 py-4 bg-white text-red-700 text-sm font-bold uppercase tracking-widest text-center hover:bg-zinc-100 transition-colors">
              Reserve a Spot
            </Link>
            <Link href="/availability" className="px-8 py-4 border-2 border-white text-white text-sm font-bold uppercase tracking-widest text-center hover:bg-red-800 transition-colors">
              Check Availability
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
