import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/app/lib/session'

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (path === '/admin/login') {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifySession(token))) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
