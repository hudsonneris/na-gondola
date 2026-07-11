import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { networksTable } from "./networks";

export const scheduledVisitsTable = pgTable("scheduled_visits", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  networkId: integer("network_id").references(() => networksTable.id, { onDelete: "set null" }),

  // 🔥 Dias da semana (array de números, 0=Domingo...6=Sábado) - AGORA OPCIONAL
  daysOfWeek: integer("days_of_week").array(),

  // 🔥 Horário com duração
  startTime: text("start_time"), // Formato: "09:00"
  endTime: text("end_time"),     // Formato: "10:00"

  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertScheduledVisitSchema = createInsertSchema(scheduledVisitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateScheduledVisitSchema = createInsertSchema(scheduledVisitsTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

export type InsertScheduledVisit = z.infer<typeof insertScheduledVisitSchema>;
export type UpdateScheduledVisit = z.infer<typeof updateScheduledVisitSchema>;
export type ScheduledVisit = typeof scheduledVisitsTable.$inferSelect;