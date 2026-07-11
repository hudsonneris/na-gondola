import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { networksTable } from "./networks";
import { clientsTable } from "./clients";

export const promotersTable = pgTable("promoters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 🔥 Relacionamento Promotor x Cliente
export const promoterClientsTable = pgTable("promoter_clients", {
  id: serial("id").primaryKey(),
  promoterId: integer("promoter_id").notNull().references(() => promotersTable.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  { name: "promoter_clients_unique", columns: [t.promoterId, t.clientId] },
]);

// 🔥 Relacionamento Promotor x Rede (substituindo Promotor x Loja)
export const promoterNetworksTable = pgTable("promoter_networks", {
  id: serial("id").primaryKey(),
  promoterId: integer("promoter_id").notNull().references(() => promotersTable.id, { onDelete: "cascade" }),
  networkId: integer("network_id").notNull().references(() => networksTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  { name: "promoter_networks_unique", columns: [t.promoterId, t.networkId] },
]);

export const insertPromoterSchema = createInsertSchema(promotersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updatePromoterSchema = createInsertSchema(promotersTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertPromoter = z.infer<typeof insertPromoterSchema>;
export type UpdatePromoter = z.infer<typeof updatePromoterSchema>;
export type Promoter = typeof promotersTable.$inferSelect;