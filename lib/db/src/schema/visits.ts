import { pgTable, serial, integer, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { productsTable } from "./products";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  visitedAt: timestamp("visited_at", { mode: 'string' }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'string' }),
  checkIn: timestamp("check_in", { mode: 'string' }),
  checkOut: timestamp("check_out", { mode: 'string' }),
  durationMinutes: integer("duration_minutes"),
  status: text("status").default('draft').notNull(),
  photoBefore: text("photo_before"),
  photoAfter: text("photo_after"),
  photoBeforeTimestamp: timestamp("photo_before_timestamp", { mode: 'string' }),
  photoAfterTimestamp: timestamp("photo_after_timestamp", { mode: 'string' }),
  photoBeforeLocation: text("photo_before_location"),
  photoAfterLocation: text("photo_after_location"),
});

export const visitItemsTable = pgTable("visit_items", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull().references(() => visitsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  inStock: boolean("in_stock").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  supplyStatus: text("supply_status").array().notNull().default([]),
}, (t) => [
  { name: "visit_items_visit_product_unique", columns: [t.visitId, t.productId] },
]);

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true });
export const insertVisitItemSchema = createInsertSchema(visitItemsTable).omit({ id: true });

export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type InsertVisitItem = z.infer<typeof insertVisitItemSchema>;
export type Visit = typeof visitsTable.$inferSelect;
export type VisitItem = typeof visitItemsTable.$inferSelect;
