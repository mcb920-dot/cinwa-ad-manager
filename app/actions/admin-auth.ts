'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSession, COOKIE_NAME } from '@/app/lib/session'

export async function login(formData: FormData) {
  const password = formData.get('password') as string
  if (password && password === process.env.ADMIN_PASSWORD) {
    const token = await createSession()
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    redirect('/admin')
  }
  redirect('/admin/login?error=1')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect('/admin/login')
}
