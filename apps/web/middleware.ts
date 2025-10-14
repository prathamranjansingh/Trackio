import AppMiddleware from "@/lib/middleware/app";
import { parse } from "@/lib/middleware/parse";
import * as Utils from "@trackio/utils";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

let middlewareRunCount = 0;

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|sitemap.xml|robots.txt).*)"],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  middlewareRunCount++;
  console.log(`[Middleware] Run count: ${middlewareRunCount}`);

  const { domain } = parse(req);

  // 👇 TypeScript-safe workaround for mixed ESM/CJS behavior
  const anyUtils = Utils as any;
  const rawHostnames =
    anyUtils.APP_HOSTNAMES ||
    anyUtils.default?.APP_HOSTNAMES ||
    (typeof anyUtils.APP_HOSTNAMES === "function"
      ? anyUtils.APP_HOSTNAMES()
      : null);

  const APP_HOSTNAMES_SET =
    rawHostnames instanceof Set
      ? rawHostnames
      : new Set(Array.isArray(rawHostnames) ? rawHostnames : []);

  const isAppHostname = APP_HOSTNAMES_SET.has(domain);

  if (isAppHostname) {
    const response = await AppMiddleware(req);
    return response;
  }

  return NextResponse.next();
}
