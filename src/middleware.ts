
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware is a pass-through and does not perform any logic.
// All authentication and session handling is managed in the page components and server actions.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Config to apply middleware to all paths.
export const config = {
  matcher: '/:path*',
}
