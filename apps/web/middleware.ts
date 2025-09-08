import AppMiddleware from "@/lib/middleware/app";
import { parse } from "@/lib/middleware/parse";
import { APP_HOSTNAMES } from "@trackio/utils";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

let middlewareRunCount = 0;

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api/|_next/|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  middlewareRunCount++;
  console.log(`[Middleware] Run count: ${middlewareRunCount}`);

  const { domain, path, fullPath } = parse(req);
  const isAppHostname = APP_HOSTNAMES.has(domain);

  // Only run AppMiddleware for app hostnames
  if (isAppHostname) {
    const response = await AppMiddleware(req);
    return response;
  }

  return NextResponse.next();
}
