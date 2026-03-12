import { Router } from "express";
import { getUsageStats } from "@/00_infra/openai/usage.tracker.js";
import { envVariables } from "@/00_infra/env/envVariables.js";

export const adminRouter = Router();

// ─── GET /admin/usage ───────────────────────────────────────────────
// Returns in-process token stats + OpenAI org-level usage (if admin key set).

adminRouter.get("/usage", async (_req, res) => {
  const local = getUsageStats();

  // Fetch org-level usage from OpenAI admin API (last 30 days)
  let openaiUsage: unknown = null;
  const adminKey = envVariables.OPENAI_ADMIN_KEY;

  if (adminKey) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const allBuckets: unknown[] = [];
      let nextPage: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          start_time: String(thirtyDaysAgo),
          end_time: String(now),
          bucket_width: "1d",
        });
        params.append("group_by[]", "model");
        if (nextPage) params.set("page", nextPage);

        const response = await fetch(
          `https://api.openai.com/v1/organization/usage/completions?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${adminKey}`,
            },
          },
        );

        if (!response.ok) {
          const body = await response.text();
          console.warn(
            `[Admin] OpenAI usage API returned ${response.status}: ${body}`,
          );
          break;
        }

        const page = (await response.json()) as {
          data: unknown[];
          has_more: boolean;
          next_page: string | null;
        };

        allBuckets.push(...page.data);
        hasMore = page.has_more;
        nextPage = page.next_page ?? null;
      }

      openaiUsage = allBuckets;
    } catch (err) {
      console.warn("[Admin] Failed to fetch OpenAI org usage:", err);
    }
  }

  res.json({
    local,
    openaiUsage,
    hasAdminKey: !!adminKey,
  });
});
