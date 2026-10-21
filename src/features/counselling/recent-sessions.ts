import { type SQL, sql } from "drizzle-orm";
import { daysBefore } from "@/academic-periods/days-before";
import { counsellingSessions } from "@/db/schema";

/** The days "Sesi 30 hari" looks back over, today not counted. */
const SESSION_DAYS = 30;

/** The sessions held from 30 days before today up to today, on campus. */
export function heldInLast30Days(today: string): SQL {
  const from = daysBefore(today, SESSION_DAYS);
  return sql`${counsellingSessions.day} between ${from} and ${today}`;
}
