import { pgTable, serial, integer, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { visitsTable } from "./visits";
import { productsTable } from "./products";

export const visitItemsTable = pgTable("visit_items", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull().references(() => visitsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),

  inStock: boolean("in_stock").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  shelfCondition: text("shelf_condition").notNull(),
  notes: text("notes"),

  // 🔥 MUDANÇA: "problems" agora é "supplyStatus"
  supplyStatus: text("supply_status").array().notNull().default([]),
}, (t) => [
  { name: "visit_items_visit_product_unique", columns: [t.visitId, t.productId] },
]);

export const insertVisitItemSchema = createInsertSchema(visitItemsTable).omit({ id: true });
export const updateVisitItemSchema = createInsertSchema(visitItemsTable).partial().omit({ id: true });

export type InsertVisitItem = z.infer<typeof insertVisitItemSchema>;
export type UpdateVisitItem = z.infer<typeof updateVisitItemSchema>;
export type VisitItem = typeof visitItemsTable.$inferSelect;