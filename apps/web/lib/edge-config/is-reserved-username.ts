import { get } from "@vercel/edge-config";

/**
 * Only for dub.sh / dub.link domains
 * Check if a username is reserved – should only be available on Pro+
 */
export const isReservedUsername = async (key: string) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let reservedUsernames: string[] = [];
  try {
    const value = await get("reservedUsernames");
    if (Array.isArray(value)) {
      reservedUsernames = value.filter((v): v is string => typeof v === "string");
    }
  } catch (e) {
    reservedUsernames = [];
  }
  return reservedUsernames.includes(key.toLowerCase());
};
