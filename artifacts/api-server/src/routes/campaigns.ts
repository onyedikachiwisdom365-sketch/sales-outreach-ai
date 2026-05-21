import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, campaignsTable, prospectsTable, emailsTable, activityTable } from "@workspace/db";
import {
  CreateCampaignBody,
  UpdateCampaignBody,
  GetCampaignParams,
  UpdateCampaignParams,
  DeleteCampaignParams,
  ListCampaignsResponse,
  GetCampaignResponse,
  UpdateCampaignResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/campaigns", async (_req, res): Promise<void> => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);

  const result = await Promise.all(
    campaigns.map(async (c) => {
      const [{ value: prospectCount }] = await db
        .select({ value: count() })
        .from(prospectsTable)
        .where(eq(prospectsTable.campaignId, c.id));

      const [{ value: emailsSent }] = await db
        .select({ value: count() })
        .from(emailsTable)
        .where(and(eq(emailsTable.campaignId, c.id), eq(emailsTable.status, "sent")));

      return {
        ...c,
        prospectCount: Number(prospectCount),
        emailsSent: Number(emailsSent),
      };
    })
  );

  res.json(ListCampaignsResponse.parse(serializeDates(result)));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [campaign] = await db.insert(campaignsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "campaign_created",
    description: `Campaign created: ${campaign.name}`,
    campaignId: campaign.id,
  });

  const response = { ...campaign, prospectCount: 0, emailsSent: 0 };
  res.status(201).json(GetCampaignResponse.parse(serializeDates(response)));
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id));

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const [{ value: prospectCount }] = await db
    .select({ value: count() })
    .from(prospectsTable)
    .where(eq(prospectsTable.campaignId, campaign.id));

  const [{ value: emailsSent }] = await db
    .select({ value: count() })
    .from(emailsTable)
    .where(and(eq(emailsTable.campaignId, campaign.id), eq(emailsTable.status, "sent")));

  const result = {
    ...campaign,
    prospectCount: Number(prospectCount),
    emailsSent: Number(emailsSent),
  };

  res.json(GetCampaignResponse.parse(serializeDates(result)));
});

router.patch("/campaigns/:id", async (req, res): Promise<void> => {
  const params = UpdateCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [campaign] = await db
    .update(campaignsTable)
    .set(parsed.data)
    .where(eq(campaignsTable.id, params.data.id))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const [{ value: prospectCount }] = await db
    .select({ value: count() })
    .from(prospectsTable)
    .where(eq(prospectsTable.campaignId, campaign.id));

  const [{ value: emailsSent }] = await db
    .select({ value: count() })
    .from(emailsTable)
    .where(and(eq(emailsTable.campaignId, campaign.id), eq(emailsTable.status, "sent")));

  const result = {
    ...campaign,
    prospectCount: Number(prospectCount),
    emailsSent: Number(emailsSent),
  };

  res.json(UpdateCampaignResponse.parse(serializeDates(result)));
});

router.delete("/campaigns/:id", async (req, res): Promise<void> => {
  const params = DeleteCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .delete(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
