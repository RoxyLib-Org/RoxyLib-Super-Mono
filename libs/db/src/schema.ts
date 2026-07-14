import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Example schema — replace with your actual tables
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
