import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const networksTable = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNetworkSchema = createInsertSchema(networksTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateNetworkSchema = createInsertSchema(networksTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertNetwork = z.infer<typeof insertNetworkSchema>;
export type UpdateNetwork = z.infer<typeof updateNetworkSchema>;
export type Network = typeof networksTable.$inferSelect;