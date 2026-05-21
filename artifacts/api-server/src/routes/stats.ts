import { Router, type IRouter } from "express";
import { eq, count, gte, desc } from "drizzle-orm";
import { db, prospectsTable, campaignsTable, emailsTable, activityTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [{ value: totalProspects }] = await db.select({ value: count() }).from(prospectsTable);
  const [{ value: totalCampaigns }] = await db.select({ value: count() }).from(campaignsTable);
  const [{ value: emailsSent }] = await db
    .select({ value: count() })
    .from(emailsTable)
    .where(eq(emailsTable.status, "sent"));
  const [{ value: emailsDraft }] = await db
    .select({ value: count() })
    .from(emailsTable)
    .where(eq(emailsTable.status, "draft"));
  const [{ value: repliedCount }] = await db
    .select({ value: count() })
    .from(prospectsTable)
    .where(eq(prospectsTable.status, "replied"));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const [{ value: newProspectsThisWeek }] = await db
    .select({ value: count() })
    .from(prospectsTable)
    .where(gte(prospectsTable.createdAt, oneWeekAgo));

  const sentNum = Number(emailsSent);
  const repliedNum = Number(repliedCount);
  const openRate = sentNum > 0 ? Math.round((repliedNum / sentNum) * 100) / 100 : 0;

  const statusGroups = await db
    .select({ status: prospectsTable.status, count: count() })
    .from(prospectsTable)
    .groupBy(prospectsTable.status);

  const prospectsByStatus = statusGroups.map((g) => ({
    status: g.status,
    count: Number(g.count),
  }));

  const result = {
    totalProspects: Number(totalProspects),
    totalCampaigns: Number(totalCampaigns),
    emailsSent: sentNum,
    emailsDraft: Number(emailsDraft),
    openRate,
    repliedCount: repliedNum,
    newProspectsThisWeek: Number(newProspectsThisWeek),
    prospectsByStatus,
  };

  res.json(GetDashboardStatsResponse.parse(result));
});

router.get("/activity", async (req, res): Promise<void> => {
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 20;

  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  const enriched = await Promise.all(
    activities.map(async (a) => {
      let prospectName = null;
      let campaignName = null;

      if (a.prospectId) {
        const [prospect] = await db
          .select()
          .from(prospectsTable)
          .where(eq(prospectsTable.id, a.prospectId));
        prospectName = prospect?.name ?? null;
      }

      if (a.campaignId) {
        const [campaign] = await db
          .select()
          .from(campaignsTable)
          .where(eq(campaignsTable.id, a.campaignId));
        campaignName = campaign?.name ?? null;
      }

      return {
        ...a,
        prospectName,
        campaignName,
      };
    })
  );

  res.json(GetRecentActivityResponse.parse(serializeDates(enriched)));
});

export default router;
