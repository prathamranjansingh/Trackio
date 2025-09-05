import { get } from "@vercel/edge-config";

export const isBlacklistedKey = async (key: string) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let blacklistedKeys: string[] = [];
  try {
    const value = await get("keys");
    if (Array.isArray(value)) {
      blacklistedKeys = value.filter((v): v is string => typeof v === "string");
    }
  } catch (e) {
    blacklistedKeys = [];
  }
  if (blacklistedKeys.length === 0) return false;
  return new RegExp(blacklistedKeys.join("|"), "i").test(key);
};
