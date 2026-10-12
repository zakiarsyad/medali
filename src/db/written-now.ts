import { sql } from "drizzle-orm";

/**
 * The moment a log line is written. The database would otherwise give the
 * moment its transaction began, and a change that began first but waited
 * for another one would be logged as the earlier of the two.
 */
export const WRITTEN_NOW = sql<Date>`clock_timestamp()`;
