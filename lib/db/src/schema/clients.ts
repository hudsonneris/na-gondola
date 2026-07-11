import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { networksTable } from "./networks";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  cnpj: text("cnpj"),
  phone: text("phone"),
  email: text("email"),

  // 🔥 MANTENDO address (para migração segura)
  address: text("address"),

  // 🔥 Endereço separado (novos campos)
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  complement: text("complement"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),

  notes: text("notes"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clientNetworksTable = pgTable("client_networks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  networkId: integer("network_id").notNull().references(() => networksTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  { name: "client_networks_unique", columns: [t.clientId, t.networkId] },
]);

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateClientSchema = createInsertSchema(clientsTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type Client = typeof clientsTable.$inferSelect;