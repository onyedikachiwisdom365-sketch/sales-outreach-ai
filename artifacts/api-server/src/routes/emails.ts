import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, emailsTable, prospectsTable, activityTable } from "@workspace/db";
import {
  CreateEmailBody,
  UpdateEmailBody,
  GetEmailParams,
  UpdateEmailParams,
  DeleteEmailParams,
  SendEmailParams,
  ListEmailsQueryParams,
  ListEmailsResponse,
  GetEmailResponse,
  UpdateEmailResponse,
  SendEmailResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";
import {
  sendEmailWithSendGrid,
  SendGridConfigurationError,
  SendGridDeliveryError,
} from "../lib/sendgrid";

const router: IRouter = Router();

async function enrichEmail(email: typeof emailsTable.$inferSelect) {
  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, email.prospectId));

  return {
    ...email,
    prospectName: prospect?.name ?? null,
    prospectEmail: prospect?.email ?? null,
    prospectCompany: prospect?.company ?? null,
  };
}

router.get("/emails", async (req, res): Promise<void> => {
  const query = ListEmailsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.prospectId != null) conditions.push(eq(emailsTable.prospectId, query.data.prospectId));
  if (query.data.campaignId != null) conditions.push(eq(emailsTable.campaignId, query.data.campaignId));
  if (query.data.status) conditions.push(eq(emailsTable.status, query.data.status));

  const emails = conditions.length > 0
    ? await db.select().from(emailsTable).where(and(...conditions)).orderBy(desc(emailsTable.createdAt))
    : await db.select().from(emailsTable).orderBy(desc(emailsTable.createdAt));

  const enriched = await Promise.all(emails.map(enrichEmail));
  res.json(ListEmailsResponse.parse(serializeDates(enriched)));
});

router.post("/emails", async (req, res): Promise<void> => {
  const parsed = CreateEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [email] = await db.insert(emailsTable).values(parsed.data).returning();
  const enriched = await enrichEmail(email);
  res.status(201).json(GetEmailResponse.parse(serializeDates(enriched)));
});

router.get("/emails/:id", async (req, res): Promise<void> => {
  const params = GetEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [email] = await db
    .select()
    .from(emailsTable)
    .where(eq(emailsTable.id, params.data.id));

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const enriched = await enrichEmail(email);
  res.json(GetEmailResponse.parse(serializeDates(enriched)));
});

router.patch("/emails/:id", async (req, res): Promise<void> => {
  const params = UpdateEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [email] = await db
    .update(emailsTable)
    .set(parsed.data)
    .where(eq(emailsTable.id, params.data.id))
    .returning();

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const enriched = await enrichEmail(email);
  res.json(UpdateEmailResponse.parse(serializeDates(enriched)));
});

router.delete("/emails/:id", async (req, res): Promise<void> => {
  const params = DeleteEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [email] = await db
    .delete(emailsTable)
    .where(eq(emailsTable.id, params.data.id))
    .returning();

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/emails/:id/send", async (req, res): Promise<void> => {
  const params = SendEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [email] = await db
    .select()
    .from(emailsTable)
    .where(eq(emailsTable.id, params.data.id));

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  if (email.status !== "draft") {
    res.status(409).json({ error: `Email is already ${email.status} and cannot be sent again.` });
    return;
  }

  const enriched = await enrichEmail(email);

  if (!enriched.prospectEmail) {
    res.status(422).json({ error: "The selected prospect does not have an email address." });
    return;
  }

  try {
    await sendEmailWithSendGrid({
      to: enriched.prospectEmail,
      toName: enriched.prospectName,
      subject: email.subject,
      body: email.body,
    });
  } catch (error) {
    if (error instanceof SendGridConfigurationError) {
      req.log.error({ err: error, emailId: email.id }, "SendGrid is not configured");
      res.status(503).json({ error: error.message });
      return;
    }

    req.log.error(
      {
        err: error,
        emailId: email.id,
        prospectId: email.prospectId,
        sendGridStatus: error instanceof SendGridDeliveryError ? error.status : undefined,
      },
      "SendGrid delivery failed",
    );
    res.status(502).json({
      error: error instanceof SendGridDeliveryError
        ? error.message
        : "SendGrid delivery failed. Check the API server logs.",
    });
    return;
  }

  const [sentEmail] = await db
    .update(emailsTable)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(emailsTable.id, email.id))
    .returning();

  await db.insert(activityTable).values({
    type: "email_sent",
    description: `Email sent to ${enriched.prospectName ?? enriched.prospectEmail}`,
    prospectId: email.prospectId,
    campaignId: email.campaignId ?? undefined,
  });

  await db
    .update(prospectsTable)
    .set({ status: "contacted" })
    .where(and(eq(prospectsTable.id, email.prospectId), eq(prospectsTable.status, "new")));

  res.json(SendEmailResponse.parse(serializeDates({ ...sentEmail, ...enriched })));
});

export default router;
