import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  currentStock: numeric("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  maxStock: numeric("max_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  avgDailyUsage: numeric("avg_daily_usage", { precision: 10, scale: 2 }).notNull().default("0"),
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, lastUpdated: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;
