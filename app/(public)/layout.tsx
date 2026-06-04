import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CINWA — Contractors in Northwest Arkansas',
  description: 'Featured placement for local contractors inside the NWA contractor directory.',
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 bg-white">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Northwest Arkansas
            </span>
            <span className="text-base font-bold text-zinc-900">CINWA Contractors</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/availability"
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block"
            >
              Availability
            </Link>
            <Link
              href="/availability"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Check Availability
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 bg-zinc-50 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} CINWA — Contractors in Northwest Arkansas</p>
          <div className="flex gap-6">
            <Link href="/availability" className="hover:text-zinc-900 transition-colors">
              Check Availability
            </Link>
            <Link href="/reserve" className="hover:text-zinc-900 transition-colors">
              Reserve a Spot
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
