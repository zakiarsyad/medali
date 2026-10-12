import { sql } from "drizzle-orm";
import { students } from "@/db/schema";

/**
 * A member who counts in the size of a group: an Aktif student. A member
 * on Cuti does not count, and neither does one who is Non aktif or was
 * removed.
 */
export const COUNTED_MEMBER = sql`${students.status} = 'active' and ${students.deletedAt} is null`;

/**
 * A member the page of a group lists: one who is Aktif or on Cuti. A Non
 * aktif or removed student stays in the group's stored members, unseen.
 */
export const LISTED_MEMBER = sql`${students.status} <> 'inactive' and ${students.deletedAt} is null`;
