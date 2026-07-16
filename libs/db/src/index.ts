import type { D1Database } from "@cloudflare/workers-types";
import { and, asc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";
export * as schema from "./schema";
export { and, asc, eq };

/** The Drizzle ORM instance type for this project's schema. */
export type Database = DrizzleD1Database<typeof schema>;

export default function db(d1: D1Database): Database {
  return drizzle(d1, { schema });
}
