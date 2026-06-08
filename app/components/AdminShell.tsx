'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function AdminShell({
  children,
  newReservationCount = 0,
}: {
  children: React.ReactNode
  newReservationCount?: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-1 min-h-full">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static in-flow on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 lg:static lg:inset-auto lg:z-auto transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setOpen(false)} newReservationCount={newReservationCount} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-full overflow-x-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-12 bg-zinc-950 border-b border-white/[0.08] shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="text-sm font-black tracking-tight text-white">
            <span className="text-red-500">C</span>INWA
          </span>
          <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.15em]">Ad Manager</span>
        </div>

        {children}
      </div>
    </div>
  )
}
