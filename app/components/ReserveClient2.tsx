'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase'

const PARTNER_LIMIT = 20
const COVER_LIMIT   = 4

type Month    = { id: number; name: string }
type Category = { id: number; name: string }
type PackageType = 'featured_partner' | 'cover_sponsor'

type Props = {
  months: Month[]
  categories: Category[]
  initialMonthId: number | null
}

const EMPTY = {
  monthId: '', packageType: '' as PackageType | '',
  categoryId: '', companyName: '', contactName: '',
  email: '', phone: '', website: '', facebookUrl: '', message: '',
}

const INPUT = 'w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-colors'
const SELECT = `${INPUT} cursor-pointer`

export default function ReserveClient({ months, categories, initialMonthId }: Props) {
  const [form, setForm]               = useState({ ...EMPTY, monthId: initialMonthId ? String(initialMonthId) : '' })
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted]     = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  useEffect(() => {
    setCapacityError(null)
    setAvailableCategories([])
    if (!form.monthId || !form.packageType) return

    const monthId = Number(form.monthId)
    setCheckingAvailability(true)

    if (form.packageType === 'featured_partner') {
      Promise.all([
        // Capacity: count active partner_spots + paid featured_partner reservations
        supabase
          .from('partner_spots')
          .select('*', { count: 'exact', head: true })
          .eq('month_id', monthId)
          .eq('active', true),
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('month_id', monthId)
          .eq('package_type', 'featured_partner')
          .eq('status', 'Paid'),
        // Taken categories: partner_spots + paid reservations
        supabase
          .from('partner_spots')
          .select('category_id')
          .eq('month_id', monthId)
          .eq('active', true),
        supabase
          .from('reservations')
          .select('category_id')
          .eq('month_id', monthId)
          .eq('package_type', 'featured_partner')
          .eq('status', 'Paid'),
      ]).then(([spotCountRes, resCountRes, takenSpotsRes, takenResRes]) => {
        const totalUsed = (spotCountRes.count ?? 0) + (resCountRes.count ?? 0)
        if (totalUsed >= PARTNER_LIMIT) {
          setCapacityError('This month is full. Please choose another month.')
        } else {
          const takenIds = new Set([
            ...(takenSpotsRes.data?.map((s: { category_id: number }) => s.category_id) ?? []),
            ...(takenResRes.data?.map((r: { category_id: number }) => r.category_id) ?? []),
          ])
          setAvailableCategories(categories.filter((c) => !takenIds.has(c.id)))
        }
        setCheckingAvailability(false)
      })
    } else {
      // Cover sponsor: count active spots + paid reservations
      Promise.all([
        supabase
          .from('cover_sponsors')
          .select('*', { count: 'exact', head: true })
          .eq('month_id', monthId)
          .eq('active', true),
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('month_id', monthId)
          .eq('package_type', 'cover_sponsor')
          .eq('status', 'Paid'),
      ]).then(([spotsRes, resRes]) => {
        const totalUsed = (spotsRes.count ?? 0) + (resRes.count ?? 0)
        if (totalUsed >= COVER_LIMIT) {
          setCapacityError('Cover sponsor positions are full for this month.')
        }
        setCheckingAvailability(false)
      })
    }
  }, [form.monthId, form.packageType, categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (capacityError) return
    setSubmitting(true)
    setSubmitError(null)

    const { error: err } = await supabase.from('reservations').insert([{
      month_id:     Number(form.monthId),
      package_type: form.packageType,
      category_id:  form.packageType === 'featured_partner' && form.categoryId ? Number(form.categoryId) : null,
      company_name: form.companyName,
      contact_name: form.contactName,
      email:        form.email,
      phone:        form.phone,
      website:      form.website || null,
      facebook_url: form.facebookUrl || null,
      message:      form.message || null,
      status:       'New',
    }])

    setSubmitting(false)
    if (err) {
      setSubmitError(
        err.message.includes('does not exist')
          ? 'Reservation system is not yet configured. Please contact us directly.'
          : err.message
      )
      return
    }

    // Notify via Formspree — best-effort, never blocks success
    const monthName    = months.find((m) => String(m.id) === form.monthId)?.name ?? form.monthId
    const categoryName = categories.find((c) => String(c.id) === form.categoryId)?.name ?? ''
    const packageLabel = form.packageType === 'featured_partner'
      ? 'Featured Partner — $120/month'
      : 'Cover Sponsor'

    fetch('https://formspree.io/f/xkoajloe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        company_name: form.companyName,
        contact_name: form.contactName,
        email:        form.email,
        phone:        form.phone,
        month:        monthName,
        package_type: packageLabel,
        category:     form.packageType === 'featured_partner' ? categoryName : 'N/A',
        website:      form.website || '',
        facebook_url: form.facebookUrl || '',
        message:      form.message || '',
      }),
    }).catch(() => {})

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-zinc-950 min-h-full flex items-center justify-center px-6 py-32">
        <div className="text-center max-w-lg">
          <div className="w-14 h-14 bg-red-700 flex items-center justify-center mx-auto mb-8">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-red-600 text-xs font-black uppercase tracking-[0.3em] mb-4">Request Received</p>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4">
            You&apos;re on the list.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed mb-10">
            Your request has been submitted. We&apos;ll follow up to confirm availability and next steps within 1–2 business days.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3.5 border border-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-widest hover:border-white hover:text-white transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    )
  }

  const selectedMonth     = months.find((m) => String(m.id) === form.monthId)
  const isFeaturedPartner = form.packageType === 'featured_partner'
  const canSubmit         = !capacityError && !checkingAvailability && form.packageType !== ''

  return (
    <div className="bg-zinc-950 min-h-full">
      <div className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-14 text-center">
          <p className="text-red-600 text-xs font-black uppercase tracking-[0.3em] mb-5">
            Reserve a Spot
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-4">
            Apply for Placement
          </h1>
          <p className="text-zinc-400 text-base max-w-lg mx-auto">
            Fill out the form below. We&apos;ll confirm your spot within 1–2 business days.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-5">
            <SectionLabel text="Placement" />

            <div>
              <Label text="Month" required />
              <select
                value={form.monthId}
                onChange={(e) => { set('monthId', e.target.value); set('categoryId', '') }}
                required
                className={SELECT}
              >
                <option value="">Select a month</option>
                {months.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div>
              <Label text="Package" required />
              <select
                value={form.packageType}
                onChange={(e) => { set('packageType', e.target.value); set('categoryId', '') }}
                required
                className={SELECT}
              >
                <option value="">Select a package</option>
                <option value="featured_partner">Featured Partner — $120/month</option>
                <option value="cover_sponsor">Cover Sponsor — Contact for pricing</option>
              </select>
            </div>

            {form.monthId && form.packageType && (
              checkingAvailability ? (
                <p className="text-zinc-500 text-sm">Checking availability…</p>
              ) : capacityError ? (
                <div className="border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                  {capacityError}
                </div>
              ) : null
            )}

            {isFeaturedPartner && !capacityError && !checkingAvailability && form.monthId && (
              <div>
                <Label text="Category" required />
                {availableCategories.length === 0 ? (
                  <p className="text-zinc-500 text-sm mt-1">No categories available for {selectedMonth?.name ?? 'this month'}.</p>
                ) : (
                  <>
                    <select
                      value={form.categoryId}
                      onChange={(e) => set('categoryId', e.target.value)}
                      required
                      className={SELECT}
                    >
                      <option value="">Select your category</option>
                      {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <p className="text-zinc-600 text-xs mt-2">
                      Showing open categories for {selectedMonth?.name ?? 'the selected month'} only.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <Divider />

          <div className="space-y-5">
            <SectionLabel text="Business Information" />
            <div>
              <Label text="Company Name" required />
              <input type="text" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required placeholder="Your business name" className={INPUT} />
            </div>
            <div>
              <Label text="Website" />
              <input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://example.com" className={INPUT} />
            </div>
            <div>
              <Label text="Facebook URL" />
              <input type="text" value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/yourbusiness" className={INPUT} />
            </div>
          </div>

          <Divider />

          <div className="space-y-5">
            <SectionLabel text="Contact Information" />
            <div>
              <Label text="Contact Name" required />
              <input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} required className={INPUT} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label text="Email" required />
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={INPUT} />
              </div>
              <div>
                <Label text="Phone" required />
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} required className={INPUT} />
              </div>
            </div>
            <div>
              <Label text="Message / Notes" />
              <textarea
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                rows={4}
                placeholder="Any questions, preferences, or notes?"
                className={`${INPUT} resize-none`}
              />
            </div>
          </div>

          {submitError && (
            <div className="border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="w-full py-4 bg-red-700 text-white font-black text-sm uppercase tracking-widest hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>

          <p className="text-xs text-zinc-600 text-center">
            Submitting does not guarantee a spot. We will confirm availability and follow up within 1–2 business days.
          </p>
        </form>
      </div>
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{text}</p>
}

function Divider() {
  return <div className="border-t border-zinc-800" />
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
      {text}{required && <span className="text-red-600 ml-0.5">*</span>}
    </label>
  )
}
