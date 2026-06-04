'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Partner Spots', href: '/admin/partner-spots' },
  { label: 'Cover Sponsors', href: '/admin/cover-sponsors' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Months', href: '/admin/months' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-zinc-900 flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CINWA</p>
        <p className="text-sm font-semibold text-white mt-0.5">Ad Manager</p>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 mt-1">
        {NAV.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
