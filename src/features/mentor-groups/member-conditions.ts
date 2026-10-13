import { sql } from "drizzle-orm";
import { students } from "@/db/schema";

/**
 * A member the page of a group lists: one who is Aktif or on Cuti. A Non
 * aktif or removed student stays in the group's stored members, unseen.
 */
export const LISTED_MEMBER = sql`${students.status} <> 'inactive' and ${students.deletedAt} is null`;
