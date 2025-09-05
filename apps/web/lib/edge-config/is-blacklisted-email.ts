import { get } from "@vercel/edge-config";

export const isBlacklistedEmail = async (email: string) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let blacklistedEmails: string[] = [];
  try {
    const value = await get("emails");
    if (Array.isArray(value)) {
      blacklistedEmails = value.filter((v): v is string => typeof v === "string");
    }
  } catch (e) {
    blacklistedEmails = [];
  }
  if (blacklistedEmails.length === 0) return false;
  return new RegExp(blacklistedEmails.join("|"), "i").test(email);
};

