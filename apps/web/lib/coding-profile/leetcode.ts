import { Provider, ProviderProfile } from "../types";

const GRAPHQL =
  process.env.LEETCODE_GRAPHQL_URL ?? "https://leetcode.com/graphql";

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 8000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const LeetCodeProvider: Provider = {
  async fetchProfile(username: string) {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            userAvatar
            ranking
            reputation
            aboutMe
          }
          submitStatsGlobal {
            totalSubmissionNum { difficulty count }
            acSubmissionNum { difficulty count }
          }
          badges { id displayName icon creationDate }
        }
      }
    `;

    const body = JSON.stringify({ query, variables: { username } });

    try {
      const res = await fetchWithTimeout(
        GRAPHQL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; Trackio/1.0)",
            Referer: "https://leetcode.com",
          },
          body,
        },
        8000
      );

      if (!res.ok) {
        // 4xx/5xx - treat as failure
        const text = await res.text();
        throw new Error(`LeetCode HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json?.data?.matchedUser) {
        return {
          provider: "leetcode",
          username,
          profileJson: json.data.matchedUser,
        } as ProviderProfile;
      }

      return null;
    } catch (err) {
      // bubble up so service layer can decide retry/behavior
      throw err;
    }
  },
};
