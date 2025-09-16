export interface UserProps {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  source: string | null;
  hasPassword: boolean;
  provider: string | null;
}

export type ProviderName = "leetcode" | "codeforces" | "gfg" | "codechef";

export interface ProviderProfile {
  provider: ProviderName;
  username: string;
  profileJson?: any;
}

export interface Provider {
  // returns profile JSON when user exists, or null when not found
  fetchProfile(username: string): Promise<ProviderProfile | null>;
}
