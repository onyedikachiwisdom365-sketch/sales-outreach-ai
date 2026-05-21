import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, prospectsTable, activityTable } from "@workspace/db";
import {
  CreateProspectBody,
  ProspectUpdate,
  GetProspectParams,
  UpdateProspectParams,
  DeleteProspectParams,
  GenerateEmailForProspectParams,
  GenerateEmailForProspectBody,
  ListProspectsQueryParams,
  ListProspectsResponse,
  GetProspectResponse,
  UpdateProspectResponse,
  GenerateEmailForProspectResponse,
} from "@workspace/api-zod";
import { generateEmailWithAI } from "../lib/ai";

const router: IRouter = Router();

router.get("/prospects", async (req, res): Promise<void> => {
  const query = ListProspectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const prospects = await db
    .select()
    .from(prospectsTable)
    .orderBy(desc(prospectsTable.createdAt));

  const filtered = prospects.filter((p) => {
    if (query.data.status && p.status !== query.data.status) return false;
    if (query.data.campaignId != null && p.campaignId !== query.data.campaignId) return false;
    return true;
  });

  res.json(ListProspectsResponse.parse(filtered));
});

router.post("/prospects", async (req, res): Promise<void> => {
  const parsed = CreateProspectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prospect] = await db.insert(prospectsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "prospect_created",
    description: `New prospect added: ${prospect.name}`,
    prospectId: prospect.id,
    campaignId: prospect.campaignId ?? undefined,
  });

  res.status(201).json(GetProspectResponse.parse(prospect));
});

router.get("/prospects/:id", async (req, res): Promise<void> => {
  const params = GetProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, params.data.id));

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  res.json(GetProspectResponse.parse(prospect));
});

router.patch("/prospects/:id", async (req, res): Promise<void> => {
  const params = UpdateProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ProspectUpdate.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prospect] = await db
    .update(prospectsTable)
    .set(parsed.data)
    .where(eq(prospectsTable.id, params.data.id))
    .returning();

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  if (parsed.data.status) {
    await db.insert(activityTable).values({
      type: "prospect_status_changed",
      description: `${prospect.name} moved to ${parsed.data.status}`,
      prospectId: prospect.id,
      campaignId: prospect.campaignId ?? undefined,
    });
  }

  res.json(UpdateProspectResponse.parse(prospect));
});

router.delete("/prospects/:id", async (req, res): Promise<void> => {
  const params = DeleteProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prospect] = await db
    .delete(prospectsTable)
    .where(eq(prospectsTable.id, params.data.id))
    .returning();

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/prospects/:id/generate-email", async (req, res): Promise<void> => {
  const params = GenerateEmailForProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = GenerateEmailForProspectBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, params.data.id));

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  const { subject, emailBody } = await generateEmailWithAI({
    prospect,
    tone: body.data.tone,
    context: body.data.context,
  });

  const { emailsTable } = await import("@workspace/db");
  const [email] = await db
    .insert(emailsTable)
    .values({
      prospectId: prospect.id,
      campaignId: body.data.campaignId ?? null,
      subject,
      body: emailBody,
      status: "draft",
    })
    .returning();

  await db.insert(activityTable).values({
    type: "email_generated",
    description: `AI-drafted email for ${prospect.name}`,
    prospectId: prospect.id,
    campaignId: body.data.campaignId ?? undefined,
  });

  const result = {
    ...email,
    prospectName: prospect.name,
    prospectEmail: prospect.email,
    prospectCompany: prospect.company,
  };

  res.json(GenerateEmailForProspectResponse.parse(result));
});

export default router;
