import { parse } from "@/lib/middleware/parse";
import { NextRequest, NextResponse } from "next/server";
import { getUserViaToken } from "@/lib/middleware/get-user-via-token";

export default async function AppMiddleware(req: NextRequest) {
  const { path } = parse(req);
  const user = await getUserViaToken(req);
  const ignoredPaths = [
    "/favicon.ico",
    "/_next/",
    "/static/",
    "/public/",
    "/.well-known/",
  ];
  if (ignoredPaths.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/auth",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  if (!user) {
    if (isPublicRoute || path === "/") return NextResponse.next();
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (user) {
    if (isPublicRoute)
      return NextResponse.redirect(new URL("/dashboard", req.url));
    if (path === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path === "/dashboard" || path.startsWith("/dashboard/"))
      return NextResponse.next();
    return NextResponse.next();
  }

  return NextResponse.next();
}
