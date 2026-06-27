import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sizesTable = sqliteTable("sizes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const insertSizeSchema = createInsertSchema(sizesTable).omit({ id: true });
export type InsertSize = z.infer<typeof insertSizeSchema>;
export type Size = typeof sizesTable.$inferSelect;
