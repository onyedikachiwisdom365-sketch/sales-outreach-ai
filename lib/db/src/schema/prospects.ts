import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prospectsTable = pgTable("prospects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  role: text("role"),
  website: text("website"),
  linkedin: text("linkedin"),
  notes: text("notes"),
  status: text("status").notNull().default("new"),
  campaignId: integer("campaign_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProspectSchema = createInsertSchema(prospectsTable).omit({ id: true, createdAt: true });
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospectsTable.$inferSelect;
