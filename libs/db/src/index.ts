import type { D1Database } from "@cloudflare/workers-types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, asc } from "drizzle-orm";
import * as schema from "./schema";

export * from "./schema";
export * as schema from "./schema";
export { eq, and, asc };

/** The Drizzle ORM instance type for this project's schema. */
export type Database = DrizzleD1Database<typeof schema>;

export default function db(d1: D1Database): Database {
  return drizzle(d1, { schema });
}
