import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("hm_auth")
  if (!auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/chat/:path*", "/memories", "/settings"],
}
