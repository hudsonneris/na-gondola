import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { networksTable } from "./networks";

export const storesTable = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),

  // 🔥 MANTENDO CAMPOS ANTIGOS (para migração segura)
  storeType: text("store_type"),
  address: text("address"),
  chain: text("chain"),

  // 🔥 NOVOS CAMPOS
  networkId: integer("network_id").references(() => networksTable.id, { onDelete: "set null" }),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  complement: text("complement"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  phone: text("phone"),
  channel: text("channel").notNull(),
  storeCode: text("store_code"),
  visitValue: numeric("visit_value", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStoreSchema = createInsertSchema(storesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateStoreSchema = createInsertSchema(storesTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type UpdateStore = z.infer<typeof updateStoreSchema>;
export type Store = typeof storesTable.$inferSelect;