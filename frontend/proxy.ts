import { jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"

const _secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "")

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("hm_auth")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  try {
    await jwtVerify(token, _secret)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete("hm_auth")
    return res
  }
}

export const config = {
  matcher: ["/chat/:path*", "/memories", "/settings"],
}
