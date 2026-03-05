import { NextRequest, NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  // Only protect mutating API endpoints
  if (!request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();
  if (!MUTATING_METHODS.has(request.method)) return NextResponse.next();

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // No API_KEY configured — allow all requests (development mode)
    return NextResponse.next();
  }

  const providedKey = request.headers.get("X-API-Key");
  if (providedKey !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
