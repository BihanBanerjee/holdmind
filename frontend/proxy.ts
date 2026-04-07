import { NextRequest, NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const token = req.cookies.get("hm_auth")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/chat/:path*", "/memories", "/settings"],
}
