'use client'

const ADVERTISERS = [
  'SR1 Roofing',
  'Pure Comfort',
  'Elite Dumpster',
  'Trees Out Express',
  'CJ Commercial Roofing',
]

// Quadruple so the marquee fills any screen width with room to spare.
// Animation moves -50% so the second half is a seamless copy of the first.
const ITEMS = [...ADVERTISERS, ...ADVERTISERS, ...ADVERTISERS, ...ADVERTISERS]

export default function LogoWall() {
  return (
    <div className="bg-zinc-900 border-y border-zinc-800 py-5 overflow-hidden select-none">
      <div
        className="flex items-center w-max"
        style={{ animation: 'marquee 28s linear infinite' }}
      >
        {ITEMS.map((name, i) => (
          <span key={i} className="flex items-center">
            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-[0.25em] px-10 whitespace-nowrap">
              {name}
            </span>
            <span className="text-zinc-700 text-base leading-none">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
