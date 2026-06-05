export const dynamic = 'force-dynamic'

import { login } from '@/app/actions/admin-auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CINWA</p>
          <h1 className="text-xl font-semibold text-zinc-900 mt-1">Ad Manager</h1>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Admin login</h2>
          <form action={login} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-600 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600">Incorrect password. Please try again.</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
