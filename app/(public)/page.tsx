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
  const data        = await getPageData()
  const partnerOpen = 20 - (data?.partnerCount ?? 0)
  const coverTaken  = data?.coverSponsors.length ?? 0
  const coverOpen   = 4 - coverTaken
  const coverSlots  = Array.from({ length: 4 }, (_, i) => data?.coverSponsors[i] ?? null)

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: 'clamp(580px, 75vh, 800px)' }}>
        <Image
          src="/logo/Hero-photo.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-5xl mx-auto px-6 sm:px-10 text-center">
            <p className="text-red-400 text-xs font-black uppercase tracking-[0.3em] mb-6">
              Contractors in Northwest Arkansas
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-6 uppercase">
              Reach 17,000+ Northwest Arkansas Homeowners &amp; Contractors
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Exclusive advertising inside the region&apos;s largest contractor community.
              One business per category. Limited monthly placements.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/availability" className="px-8 py-3.5 bg-red-700 text-white text-sm font-black uppercase tracking-widest hover:bg-red-800 transition-colors">
                Check Availability
              </Link>
              <Link href="/reserve" className="px-8 py-3.5 border border-white/40 text-white text-sm font-black uppercase tracking-widest hover:border-white hover:bg-white/10 transition-colors">
                Reserve a Spot
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COVER SPONSORSHIP ────────────────────────────────────── */}
      <section className="bg-white py-24 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto text-center">

          {/* Main statement */}
          <h2 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-red-700 uppercase tracking-tight leading-[0.9] mb-6">
            Be Seen.<br />Every Time.
          </h2>
          <p className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950 mb-8">
            Your Business. Front and Center. All Month Long.
          </p>

          {/* Thin red rule */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-red-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
            <div className="h-px w-16 bg-red-700" />
          </div>

          {/* Supporting copy */}
          <p className="text-zinc-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-3">
            Think of it as a digital billboard inside one of Northwest Arkansas&apos; most active
            contractor communities. Your business is displayed on the group&apos;s cover photo —
            the first thing members see when they visit the page.
          </p>
          <p className="text-zinc-900 text-base font-bold mb-14">
            Only four positions are available each month.
          </p>

          {/* Cover photo */}
          <div className="border border-zinc-200 bg-zinc-50 p-3 sm:p-5 mb-4 max-w-3xl mx-auto">
            <Image
              src="/logo/NEWJUNECOVERPHOTO.png"
              alt="CINWA Cover Sponsor — Monthly Community Cover"
              width={1731}
              height={909}
              className="w-full h-auto"
              quality={90}
              priority
            />
          </div>

          {/* Scarcity signal */}
          {data && (
            <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">
              {data.month.name} —{' '}
              <span className={coverOpen === 0 ? 'text-red-700' : 'text-zinc-700'}>
                {coverTaken} of 4 positions claimed
                {coverOpen > 0 ? `. ${coverOpen} remaining.` : '. Sold out.'}
              </span>
            </p>
          )}

          {/* Position inventory */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-3xl mx-auto">
            {coverSlots.map((sponsor, i) => (
              sponsor ? (
                /* Claimed position */
                <div key={i} className="bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-center py-8 px-4 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Cover</p>
                    <p className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                      Position {i + 1}
                    </p>
                  </div>
                  <div className="w-8 h-px bg-zinc-700" />
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-red-500 mb-2">Claimed</span>
                    <p className="text-sm text-zinc-300 font-semibold leading-snug">{sponsor.company_name}</p>
                  </div>
                </div>
              ) : (
                /* Available position */
                <div key={i} className="border border-zinc-200 bg-white flex flex-col items-center justify-center text-center py-8 px-4 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Cover</p>
                    <p className="text-2xl font-black text-zinc-950 uppercase tracking-tight leading-none">
                      Position {i + 1}
                    </p>
                  </div>
                  <div className="w-8 h-px bg-zinc-200" />
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-3">Available</span>
                    <Link
                      href="/reserve"
                      className="text-[11px] font-black uppercase tracking-widest text-white bg-red-700 px-4 py-2 hover:bg-red-800 transition-colors"
                    >
                      Reserve
                    </Link>
                  </div>
                </div>
              )
            ))}
          </div>

          <Link
            href="/reserve"
            className="inline-block px-10 py-4 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Reserve Cover Sponsorship
          </Link>
        </div>
      </section>

      {/* ── FEATURED PARTNER ─────────────────────────────────────── */}
      <section className="bg-zinc-950 py-24 px-6 sm:px-10 border-t-4 border-red-700">
        <div className="max-w-6xl mx-auto">

          {/* Premium feature badges */}
          <div className="flex flex-wrap gap-2 mb-10">
            {[
              'One Company Per Category',
              'Monthly Featured Placement',
              'Trusted Local Professionals',
              'Direct Contact Information',
              'Built for Northwest Arkansas',
            ].map((badge) => (
              <span key={badge} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-700 px-3 py-1.5 bg-zinc-900">
                {badge}
              </span>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[0.95] mb-6">
                Connecting Locals<br />With Local Pros.
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                One company per category. Real businesses. Real relationships. Building a stronger
                contractor community across Northwest Arkansas while helping homeowners connect with
                trusted local professionals.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              {data && partnerOpen > 0 && (
                <p className="text-xs font-black uppercase tracking-widest text-red-500">
                  {partnerOpen} of 20 spots open for {data.month.name}
                </p>
              )}
              <Link
                href="/availability"
                className="px-6 py-3 border-2 border-red-700 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors text-center"
              >
                Check Availability
              </Link>
              <Link
                href="/reserve"
                className="px-6 py-3 bg-red-700 text-white text-xs font-black uppercase tracking-widest hover:bg-red-800 transition-colors text-center"
              >
                Reserve a Spot
              </Link>
            </div>
          </div>

          {/* Directory image */}
          <div className="border border-zinc-700 bg-zinc-900 p-3 sm:p-5">
            <Image
              src="/logo/PRO-JUNE-LIST.png"
              alt="CINWA Monthly Featured Partner Directory"
              width={5625}
              height={3750}
              className="w-full h-auto"
              quality={85}
            />
          </div>

          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-5">
            Every listed business is the exclusive representative of their category for the month.
          </p>
        </div>
      </section>

      {/* ── WHY CINWA ────────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-24 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <h2 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-red-700 uppercase tracking-tight leading-[0.9] text-center mb-16">
            Why CINWA?
          </h2>

          {/* Anchor stat — the number that earns the room */}
          <div className="mb-16 pb-16 border-b border-zinc-800">
            <div className="flex flex-col lg:flex-row lg:items-end gap-8">
              <div className="shrink-0">
                <p className="text-[clamp(5rem,14vw,9rem)] font-black text-white leading-none tracking-tight">17,000+</p>
                <p className="text-2xl sm:text-3xl font-black uppercase text-red-700 tracking-tight leading-tight mt-2">
                  Northwest Arkansas<br />Members.
                </p>
              </div>
              <div className="max-w-xl lg:mb-4">
                <p className="text-zinc-300 text-lg sm:text-xl leading-relaxed font-medium">
                  That&apos;s your audience. Homeowners actively looking for contractors.
                  Contractors looking for trusted professionals. All of them inside one community,
                  built specifically for Northwest Arkansas.
                </p>
                <p className="text-zinc-500 text-base mt-4 leading-relaxed">
                  Not a national ad platform. Not a generic directory.
                  A local network that has been running and growing for years.
                </p>
              </div>
            </div>
          </div>

          {/* Three value propositions — horizontal rule style */}
          <div className="space-y-0 divide-y divide-zinc-800">

            <div className="py-10 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-16">
              <div className="shrink-0 w-full sm:w-64">
                <p className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  One Business<br />Per Category.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                  Reserve your category and you own it for the month. No other roofers. No other
                  plumbers. No competing bids for the same homeowner. When a category fills,
                  it closes — and that spot has your name on it.
                </p>
              </div>
            </div>

            <div className="py-10 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-16">
              <div className="shrink-0 w-full sm:w-64">
                <p className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  Seen All<br />Month Long.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                  This isn&apos;t a 3-second banner ad. Your business appears on the community
                  cover photo and partner list every time a member visits — all month.
                  Repeat exposure builds the kind of trust that turns into a phone call.
                </p>
              </div>
            </div>

            <div className="py-10 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-16">
              <div className="shrink-0 w-full sm:w-64">
                <p className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  Built for<br />This Market.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                  CINWA was built from the ground up for Northwest Arkansas contractors and
                  homeowners. Not imported. Not national. Every member in this group is your
                  neighbor — and a potential customer.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LIVE AVAILABILITY ────────────────────────────────────── */}
      {data && (
        <section className="bg-white py-24 px-6 sm:px-10 border-t-4 border-zinc-950">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-red-700 text-xs font-black uppercase tracking-[0.3em] mb-3">Open Inventory</p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 uppercase tracking-tight leading-none">
                  Available Now.
                </h2>
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-zinc-400 shrink-0 sm:mb-1">{data.month.name}</p>
            </div>

            {/* Inventory counters */}
            <div className="grid grid-cols-2 gap-3 mt-10 mb-14 max-w-xl">
              <div className="bg-zinc-950 p-6 border-l-4 border-red-700">
                <p className="text-[3.5rem] font-black text-white leading-none">{partnerOpen}</p>
                <p className="text-xs font-black uppercase tracking-widest text-red-600 mt-2">of 20 Partner</p>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Spots Open</p>
              </div>
              <div className="bg-zinc-950 p-6 border-l-4 border-red-700">
                <p className="text-[3.5rem] font-black text-white leading-none">{coverOpen}</p>
                <p className="text-xs font-black uppercase tracking-widest text-red-600 mt-2">of 4 Cover</p>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Positions Open</p>
              </div>
            </div>

            {/* Available categories */}
            {data.available.length > 0 && (
              <div className="mb-12">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">
                  Open Categories — {data.available.length} available
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.available.map(c => (
                    <Link
                      key={c.id}
                      href="/reserve"
                      className="group border-2 border-zinc-950 bg-white p-5 flex flex-col gap-4 hover:bg-zinc-950 transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-700 group-hover:text-red-500">
                        Available
                      </span>
                      <span className="text-base font-black text-zinc-950 uppercase leading-tight group-hover:text-white">
                        {c.name}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 mt-auto">
                        Reserve →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Claimed categories */}
            {data.taken.length > 0 && (
              <div className="mb-10">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">
                  Claimed — {data.taken.length} of 20
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.taken.map(c => (
                    <div key={c.id} className="border border-zinc-200 bg-zinc-50 p-5 flex flex-col gap-3 opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Claimed</span>
                      <span className="text-base font-black text-zinc-400 uppercase leading-tight">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/availability"
              className="inline-block px-8 py-3.5 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
            >
              View Full Availability →
            </Link>
          </div>
        </section>
      )}

      {/* ── HOW PLACEMENTS WORK ──────────────────────────────────── */}
      <section className="bg-zinc-950 py-24 px-6 sm:px-10 border-t-4 border-red-700">
        <div className="max-w-6xl mx-auto">

          <p className="text-red-600 text-xs font-black uppercase tracking-[0.3em] mb-5">Featured Placement</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[0.95] mb-4 max-w-3xl">
            How Placements Work.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mb-14 leading-relaxed">
            We operate a straightforward advertising model inside Northwest Arkansas&apos; largest
            contractor community. Here is what your placement includes — and what it does not.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            <div className="bg-zinc-900 border border-zinc-800 p-7 flex flex-col gap-5">
              <div className="w-10 h-10 bg-red-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-wide mb-3">Paid Visibility</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Featured placement is premium advertising space that puts your business in front
                  of 17,000+ Northwest Arkansas community members each month.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-7 flex flex-col gap-5">
              <div className="w-10 h-10 bg-red-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-wide mb-3">What&apos;s Included</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Monthly cover photo placement, partner directory listing, and promotional
                  exposure throughout the community — all month, every month you reserve.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-7 flex flex-col gap-5">
              <div className="w-10 h-10 bg-red-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-wide mb-3">Honest Disclosure</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Featured placement increases your visibility. It does not guarantee jobs,
                  referrals, or customer selection. Homeowners choose who they hire.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-7 flex flex-col gap-5">
              <div className="w-10 h-10 bg-red-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-wide mb-3">Community First</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Our goal is to support local businesses while maintaining a trustworthy,
                  unbiased environment for every homeowner and contractor in Northwest Arkansas.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="bg-red-700 py-24 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-[0.95] max-w-lg">
              Reserve Your Category Before It Closes.
            </h2>
            <p className="text-red-200 text-sm font-medium mt-4">
              Spots are first-come. When a category fills, it is closed for the month.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/reserve" className="px-8 py-4 bg-white text-red-700 text-sm font-black uppercase tracking-widest text-center hover:bg-zinc-100 transition-colors">
              Reserve a Spot
            </Link>
            <Link href="/availability" className="px-8 py-4 border-2 border-white text-white text-sm font-black uppercase tracking-widest text-center hover:bg-red-800 transition-colors">
              Check Availability
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
