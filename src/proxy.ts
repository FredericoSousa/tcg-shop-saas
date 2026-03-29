import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  const subdomain = hostname.split('.')[0]

  if (!subdomain || subdomain === 'www' || subdomain === 'localhost' || subdomain.includes(':')) {
    return NextResponse.next()
  }

  try {
    const tenantRes = await fetch(`${url.origin}/api/tenant?slug=${subdomain}`)
    
    if (tenantRes.ok) {
      const tenant = await tenantRes.json()
      
      if (tenant && tenant.id) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-tenant-id', tenant.id)

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
    }
  } catch (err) {
    console.error('Middleware tenant lookup error:', err)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
