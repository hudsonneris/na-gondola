import { pgTable, serial, text, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),

  // 🔥 category AGORA OPCIONAL
  category: text("category"),

  // 🔥 categoryId (futuro)
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),

  brand: text("brand"),
  sku: varchar("sku", { length: 50 }),
  stock: integer("stock").default(0),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateProductSchema = createInsertSchema(productsTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type Product = typeof productsTable.$inferSelect;