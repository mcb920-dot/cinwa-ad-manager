export const COOKIE_NAME = 'admin_session'

async function computeToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return ''
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('cinwa-admin'))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSession(): Promise<string> {
  return computeToken()
}

export async function verifySession(token: string): Promise<boolean> {
  if (!token || !process.env.ADMIN_PASSWORD) return false
  const expected = await computeToken()
  return expected !== '' && token === expected
}
