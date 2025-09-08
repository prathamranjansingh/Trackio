import { NextRequest } from "next/server";

// Replace with your actual domain
export const SHORT_DOMAIN = "trackio.dev";

export const parse = (req: NextRequest) => {
  let domain = req.headers.get("host") || SHORT_DOMAIN; // fallback if host is missing
  let path = req.nextUrl.pathname;

  // remove www. from domain and convert to lowercase
  domain = domain.replace(/^www./, "").toLowerCase();
  if (domain === "localhost:3000" || domain.endsWith(".vercel.app")) {
    if (path.toLowerCase() === "/dev-test") {
      domain = "trackio-internal-test.com";
    } else {
      domain = SHORT_DOMAIN;
    }
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const searchParamsObj = Object.fromEntries(req.nextUrl.searchParams);
  const searchParamsString = searchParams.length > 0 ? `?${searchParams}` : "";
  const fullPath = `${path}${searchParamsString}`;

  // safely decode the path components
  const key = decodeURIComponent(path.split("/")[1] || "");
  const fullKey = decodeURIComponent(path.slice(1) || "");

  return {
    domain,
    path,
    fullPath,
    key,
    fullKey,
    searchParamsObj,
    searchParamsString,
  };
};
