import { pgTable, serial, integer, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { productsTable } from "./products";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  visitedAt: timestamp("visited_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const visitItemsTable = pgTable("visit_items", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull().references(() => visitsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  inStock: boolean("in_stock").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  shelfCondition: text("shelf_condition").notNull(),
  notes: text("notes"),
}, (t) => [
  { name: "visit_items_visit_product_unique", columns: [t.visitId, t.productId] },
]);

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true });
export const insertVisitItemSchema = createInsertSchema(visitItemsTable).omit({ id: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type InsertVisitItem = z.infer<typeof insertVisitItemSchema>;
export type Visit = typeof visitsTable.$inferSelect;
export type VisitItem = typeof visitItemsTable.$inferSelect;
