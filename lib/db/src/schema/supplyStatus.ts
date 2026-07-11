import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supplyStatusTable = pgTable("supply_status", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // "positive" ou "negative"
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSupplyStatusSchema = createInsertSchema(supplyStatusTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateSupplyStatusSchema = createInsertSchema(supplyStatusTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertSupplyStatus = z.infer<typeof insertSupplyStatusSchema>;
export type UpdateSupplyStatus = z.infer<typeof updateSupplyStatusSchema>;
export type SupplyStatus = typeof supplyStatusTable.$inferSelect;