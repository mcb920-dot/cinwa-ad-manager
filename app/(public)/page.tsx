import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ─── Data ────────────────────────────────────────────────────────────────────

const TRUSTED_BY = [
  'SR1 Roofing',
  'Pure Comfort',
  'Elite Dumpster',
  'Trees Out Express',
  'CJ Commercial Roofing',
  'ODST',
]

const STATS = [
  { value: '17,000+', label: 'Community Members' },
  { value: '20',      label: 'Featured Partner Spots' },
  { value: '1',       label: 'Business Per Category' },
  { value: '4',       label: 'Cover Sponsor Placements' },
]

const WHY_CARDS = [
  {
    num: '01',
    title: 'Category Exclusivity',
    body: 'You are the only business in your trade category for the month. One roofer. One HVAC company. One plumber. No competitor from the same trade appears in the same issue — ever.',
  },
  {
    num: '02',
    title: 'Built for Local, Not Mass Market',
    body: '17,000+ Northwest Arkansas members — homeowners already inside this contractor community. Not cold social traffic. Not paid search clicks from strangers. People who already trust this network.',
  },
  {
    num: '03',
    title: 'Inventory Is Deliberately Limited',
    body: '20 Featured Partner spots. 4 Cover Sponsor placements. Hard limits, every single month. Scarcity is the product. When a spot fills, it closes. There is no waitlist workaround.',
  },
  {
    num: '04',
    title: 'Print and Digital. Every Month.',
    body: 'Your placement runs in both the monthly print directory and digital distribution across NWA. Not a one-time campaign. Not seasonal. Consistent, repeated, local visibility — month after month.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Being the only roofing company listed was the difference. Homeowners who call already know who we are — there is no competing with three other roofers on the same page.',
    author: 'SR1 Roofing',
    location: 'Northwest Arkansas',
  },
  {
    quote: 'We filled our service calendar within two weeks of our first placement. There is no other local advertising that has come close to this kind of targeted reach.',
    author: 'Pure Comfort',
    location: 'Northwest Arkansas',
  },
]

// ─── Data Fetch ───────────────────────────────────────────────────────────────

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

  const [partnerRes, coverRes, categoryRes] = await Promise.all([
    db.from('partner_spots')
      .select('*', { count: 'exact', head: true })
      .eq('month_id', month.id)
      .eq('active', true),
    db.from('cover_sponsors')
      .select('*', { count: 'exact', head: true })
      .eq('month_id', month.id)
      .eq('active', true),
    db.from('categories')
      .select('id, name')
      .eq('active', true)
      .order('name'),
  ])

  const takenRes = await db
    .from('partner_spots')
    .select('category_id')
    .eq('month_id', month.id)
    .eq('active', true)

  const takenIds = new Set((takenRes.data ?? []).map((r: { category_id: number }) => r.category_id))
  const categories = (categoryRes.data ?? []) as { id: number; name: string }[]

  return {
    month,
    partnerCount: partnerRes.count ?? 0,
    coverCount:   coverRes.count ?? 0,
    available:    categories.filter((c) => !takenIds.has(c.id)),
    taken:        categories.filter((c) => takenIds.has(c.id)),
    totalCategories: categories.length,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const data = await getPageData()
  const partnerOpen = 20 - (data?.partnerCount ?? 0)
  const coverOpen   = 4  - (data?.coverCount   ?? 0)

  return (
    <>
      {/* ── SECTION 1: Hero ─────────────────────────────────────── */}
      {/*
        Replace the backgroundImage URL with your own NWA contractor photo.
        Recommended: a full-width shot of a roofing crew, excavator, or framing job.
      */}
      <section
        className="relative min-h-screen flex flex-col bg-zinc-950 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&auto=format&fit=crop&q=80')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-zinc-950/78" />

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 max-w-6xl mx-auto w-full px-8 sm:px-16 py-12">
          {/* Wordmark */}
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
            CINWA &nbsp;·&nbsp; Contractors in Northwest Arkansas
          </p>

          {/* Headline block */}
          <div className="flex-1 flex flex-col justify-center py-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400 mb-7">
              Premium Advertising Inventory
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.04] tracking-tight mb-7 max-w-4xl">
              Reach 17,000+ Northwest Arkansas Homeowners
            </h1>
            <p className="text-zinc-300 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12">
              Exclusive advertising opportunities inside the region&apos;s largest contractor community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/availability"
                className="px-8 py-4 bg-blue-700 text-white text-sm font-bold uppercase tracking-wider hover:bg-blue-600 transition-colors"
              >
                Check Availability
              </Link>
              <Link
                href="/reserve"
                className="px-8 py-4 border border-white/30 text-white text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Reserve Your Spot
              </Link>
            </div>
          </div>

          {/* Bottom strip */}
          {data && (
            <div className="border-t border-white/10 pt-6 flex flex-wrap gap-x-10 gap-y-3">
              <Stat label="Current Issue"         value={data.month.name}                                  />
              <Stat label="Partner Spots Open"    value={`${partnerOpen} of 20`} red={partnerOpen === 0}  />
              <Stat label="Cover Slots Open"      value={`${coverOpen} of 4`}    red={coverOpen === 0}    />
              <Stat label="Open Categories"       value={String(data.available.length)}                   />
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 2: Trusted By ───────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200 py-14 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400 text-center mb-10">
            Trusted By Local Businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {TRUSTED_BY.map((name) => (
              <span
                key={name}
                className="text-sm font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Statistics ───────────────────────────────── */}
      <section className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-zinc-800">
            {STATS.map(({ value, label }) => (
              <div key={label} className="px-8 py-16 text-center">
                <p className="text-6xl lg:text-7xl font-bold text-white leading-none tracking-tight">
                  {value}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Why Businesses Advertise ────────────────── */}
      <section className="bg-white border-b border-zinc-200 py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-3">
              The Case for Advertising Here
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-950">
              Why Businesses Advertise with CINWA
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {WHY_CARDS.map((card) => (
              <div
                key={card.num}
                className="bg-zinc-50 border border-zinc-200 p-10 flex flex-col"
              >
                <p className="text-6xl font-bold text-zinc-200 leading-none mb-8 tabular-nums">
                  {card.num}
                </p>
                <h3 className="text-xl font-bold text-zinc-950 mb-4">{card.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Live Availability ───────────────────────── */}
      {data && (
        <section className="bg-zinc-50 border-b border-zinc-200 py-16 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-3">
                  Live Inventory
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-zinc-950">
                  Current Availability
                </h2>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                {data.month.name}
              </p>
            </div>

            {/* Inventory grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200 mb-10">
              {[
                { label: 'Partner Spots Open',   value: partnerOpen,         alert: partnerOpen === 0 },
                { label: 'Partner Spots Filled',  value: data.partnerCount,   alert: false             },
                { label: 'Cover Slots Open',       value: coverOpen,           alert: coverOpen === 0   },
                { label: 'Cover Slots Filled',     value: data.coverCount,     alert: false             },
              ].map(({ label, value, alert }) => (
                <div key={label} className="bg-white px-6 py-7">
                  <p className={`text-4xl font-bold leading-none ${alert ? 'text-red-600' : 'text-zinc-950'}`}>
                    {value}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-3">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Category availability */}
            <div className="flex items-baseline justify-between mb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Open Categories
              </p>
              <p className="text-xs text-zinc-400">
                {data.available.length} available &nbsp;·&nbsp; {data.taken.length} taken
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6">
              {[...data.available, ...data.taken].map((c) => {
                const isTaken = data.taken.some((t) => t.id === c.id)
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 py-2 border-b text-sm ${
                      isTaken ? 'border-zinc-100 text-zinc-300' : 'border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isTaken ? 'bg-zinc-300' : 'bg-emerald-500'}`} />
                    <span className={isTaken ? 'line-through' : ''}>{c.name}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-7">
              <Link
                href="/availability"
                className="text-xs font-bold uppercase tracking-widest text-blue-700 hover:underline"
              >
                View availability for all months →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 6: Testimonials ─────────────────────────────── */}
      <section className="bg-zinc-950 border-b border-zinc-800 py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-12">
            What Advertisers Say
          </p>
          <div className="grid sm:grid-cols-2 gap-10">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-zinc-700 leading-none mb-6">&ldquo;</p>
                <p className="text-white text-base leading-relaxed mb-6">{t.quote}</p>
                <div className="border-t border-zinc-800 pt-5">
                  <p className="text-sm font-bold text-zinc-300">{t.author}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Reserve CTA ──────────────────────────────── */}
      <section className="bg-blue-700 py-20 px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300 mb-4">
              Limited Availability
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-lg">
              Reserve your category before it closes.
            </h2>
            <p className="text-blue-200 text-sm mt-3 max-w-md">
              Spots are issued on a first-come basis. When a category fills, it is closed to
              new applicants for that month.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/reserve"
              className="px-8 py-4 bg-white text-blue-700 text-sm font-bold uppercase tracking-wider hover:bg-zinc-100 transition-colors text-center"
            >
              Reserve Your Spot
            </Link>
            <Link
              href="/availability"
              className="px-8 py-4 border border-white/30 text-white text-sm font-bold uppercase tracking-wider hover:bg-blue-600 transition-colors text-center"
            >
              Check Availability
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Stat({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold ${red ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
