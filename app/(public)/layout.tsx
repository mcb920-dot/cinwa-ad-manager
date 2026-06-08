import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://contractorsinnwa.com'),
  title: 'Contractors in Northwest Arkansas',
  description: "Premium advertising opportunities inside Northwest Arkansas' largest contractor community.",
  openGraph: {
    type: 'website',
    url: 'https://contractorsinnwa.com',
    siteName: 'Contractors in Northwest Arkansas',
    title: 'Contractors in Northwest Arkansas',
    description: "Premium advertising opportunities inside Northwest Arkansas' largest contractor community.",
    images: [
      {
        url: '/logo/social-preview.png',
        width: 1200,
        height: 630,
        alt: 'CINWA advertising opportunities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contractors in Northwest Arkansas',
    description: "Premium advertising opportunities inside Northwest Arkansas' largest contractor community.",
    images: ['/logo/social-preview.png'],
  },
  icons: {
    icon: '/logo/CINWA-favicon.png',
    shortcut: '/logo/CINWA-favicon.png',
    apple: '/logo/CINWA-favicon.png',
  },
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

      <footer className="bg-zinc-950 py-14 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10 pb-10 border-b border-zinc-800">

            {/* Brand */}
            <div>
              <Image
                src="/logo/CINWA-footer-logo.png"
                alt="CINWA — Contractors in Northwest Arkansas"
                width={112}
                height={112}
                className="object-contain w-20 sm:w-28 h-auto"
              />
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Contact</p>
              <a
                href="mailto:biz.cinwa@gmail.com"
                className="text-sm text-zinc-300 hover:text-white transition-colors"
              >
                biz.cinwa@gmail.com
              </a>
              <a
                href="https://www.facebook.com/CINWAbusiness/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-300 hover:text-red-500 transition-colors"
              >
                Facebook — CINWA Business
              </a>
            </div>

            {/* Nav */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Advertise</p>
              <Link href="/availability" className="text-sm text-zinc-300 hover:text-white transition-colors">
                Check Availability
              </Link>
              <Link href="/reserve" className="text-sm text-zinc-300 hover:text-red-500 transition-colors">
                Reserve a Spot
              </Link>
            </div>

          </div>

          <p className="text-zinc-600 text-xs pt-6">Copyright © {new Date().getFullYear()} Contractors in Northwest Arkansas</p>

        </div>
      </footer>
    </div>
  )
}
