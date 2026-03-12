export const maxDuration = 60; // Next.js max duration for serverless functions

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  
  if (currentPath.startsWith("/admin") && currentPath !== "/admin/login") {
    const adminToken = request.cookies.get("admin_token")?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
