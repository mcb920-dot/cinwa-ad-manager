import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CINWA — Contractors in Northwest Arkansas',
  description: 'Advertise to 17,000+ Northwest Arkansas homeowners and contractors. Limited monthly placements.',
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 bg-white">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo/CINWA-LOGO-WHITEBG.jpg"
              alt="CINWA — Contractors in Northwest Arkansas"
              width={120}
              height={80}
              priority
              className="object-contain"
              style={{ mixBlendMode: 'multiply', width: '120px', height: 'auto' }}
            />
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/availability" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block">
              Availability
            </Link>
            <Link href="/reserve" className="text-sm font-semibold text-zinc-900 hover:text-red-700 transition-colors">
              Reserve a Spot
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 bg-zinc-950 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Image
              src="/logo/CINWA-LOGO-WHITEBG.jpg"
              alt="CINWA"
              width={90}
              height={60}
              className="object-contain h-8 w-auto"
              style={{ mixBlendMode: 'screen' }}
            />
            <p className="text-zinc-500 text-xs mt-2">Contractors in Northwest Arkansas</p>
          </div>
          <div className="flex gap-8 text-xs text-zinc-500">
            <Link href="/availability" className="hover:text-white transition-colors">Check Availability</Link>
            <Link href="/reserve" className="hover:text-white transition-colors">Reserve a Spot</Link>
          </div>
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} CINWA</p>
        </div>
      </footer>
    </div>
  )
}
