import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailsTable = pgTable("emails", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull(),
  campaignId: integer("campaign_id"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailSchema = createInsertSchema(emailsTable).omit({ id: true, createdAt: true, sentAt: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emailsTable.$inferSelect;
