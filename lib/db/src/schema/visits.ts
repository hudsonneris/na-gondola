import { pgTable, serial, integer, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { productsTable } from "./products";
import { promotersTable } from "./promoters";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  promoterId: integer("promoter_id").references(() => promotersTable.id, { onDelete: "set null" }),
  visitedAt: timestamp("visited_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Check-in / Check-out
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  durationMinutes: integer("duration_minutes"),

  // Status: pending, in_progress, completed, draft
  status: text("status").notNull().default("draft"),

  // Fotos
  photoBefore: text("photo_before"),
  photoAfter: text("photo_after"),
  photoBeforeTimestamp: timestamp("photo_before_timestamp"),
  photoAfterTimestamp: timestamp("photo_after_timestamp"),
  photoBeforeLocation: text("photo_before_location"),
  photoAfterLocation: text("photo_after_location"),
});

export const visitItemsTable = pgTable("visit_items", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull().references(() => visitsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),

  inStock: boolean("in_stock").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  // 🔥 REMOVIDO: shelfCondition (Demanda 4)
  notes: text("notes"),
  // 🔥 RENOMEADO: problems → supplyStatus (Demanda 10)
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