import { Provider } from "../types";
import { LeetCodeProvider } from "./leetcode";

const registry: Record<string, Provider> = {
  leetcode: LeetCodeProvider,
  // add more providers here:
  // codeforces: CodeforcesProvider,
  // gfg: GfgProvider,
};

export function getProvider(name: string): Provider | null {
  return (registry as any)[name] ?? null;
}
