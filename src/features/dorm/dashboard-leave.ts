import { and, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormLeaves } from "@/db/schema";
import { countWhere } from "./leave-list";
import { outAt, outLateAt } from "./return-conditions";

/** The numbers of leave on Dashboard asrama. */
export interface LeaveNumbers {
  /** Sedang di luar asrama, as "Sedang di luar" on Perizinan asrama. */
  out: number;
  /** Those of them out past their return time. */
  outLate: number;
  /** Izin menunggu verifikasi, as "Menunggu verifikasi" on Perizinan asrama. */
  waiting: number;
}

/** The numbers of leave at a moment, among the students `visible` holds. */
export async function readLeaveNumbers(
  db: Database,
  visible: SQL,
  now: Date,
): Promise<LeaveNumbers> {
  const [out, outLate, waiting] = await Promise.all([
    countWhere(db, and(visible, outAt(now))),
    countWhere(db, and(visible, outLateAt(now))),
    countWhere(db, and(visible, eq(dormLeaves.status, "submitted"))),
  ]);
  return { out, outLate, waiting };
}
