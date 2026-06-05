'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/admin-auth'

const NAV = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Partner Spots', href: '/admin/partner-spots' },
  { label: 'Cover Sponsors', href: '/admin/cover-sponsors' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Months', href: '/admin/months' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <aside className="w-56 h-full bg-zinc-950 flex flex-col border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.08]">
        <p className="text-[15px] font-black tracking-tight text-white leading-none">
          <span className="text-red-500">C</span>INWA
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mt-1.5">
          Ad Manager
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2.5 mt-1 flex-1">
        {NAV.map(({ label, href }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              {active && <span className="w-1 h-1 rounded-full bg-white/70 shrink-0" />}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2.5 border-t border-white/[0.08]">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}
