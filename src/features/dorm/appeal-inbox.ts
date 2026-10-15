import { and, asc, count, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormViolationAppeals, dormViolations, students } from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import { type Punishment, VIOLATIONS_PAGE_SIZE } from "./violation-ids";

/** One card of "Advokasi masuk". */
export interface AppealCard {
  id: string;
  studentId: string;
  name: string;
  nim: string;
  sentAt: Date;
  reason: string;
  /** The name of the proof, or null for an appeal without one. */
  proofName: string | null;
  violationDay: string;
  violationReason: string;
  punishment: Punishment;
  otherPunishment: string;
}

/** "Advokasi masuk": how many wait, and one page of them. */
export interface AppealInbox {
  waiting: number;
  cards: AppealCard[];
  page: number;
}

const WAITING = eq(dormViolationAppeals.status, "waiting");

/**
 * How many appeals of the students `visible` holds wait for BAM. Also
 * for the number on the staff screen, so the count is read alone.
 */
export async function countWaitingAppeals(
  db: Database,
  visible: SQL,
): Promise<number> {
  const [counted] = await db
    .select({ amount: count() })
    .from(dormViolationAppeals)
    .innerJoin(
      dormViolations,
      eq(dormViolations.id, dormViolationAppeals.violationId),
    )
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(and(WAITING, visible));
  return counted?.amount ?? 0;
}

/**
 * "Advokasi masuk" for the deciders: the appeals that wait, of the
 * students `visible` holds, the soonest sent first, 20 a page, each with
 * its reason and the violation it is of.
 */
export async function readAppealInbox(
  db: Database,
  visible: SQL,
  page: number,
): Promise<AppealInbox> {
  const waiting = await countWaitingAppeals(db, visible);
  const shown = pageWithin(page, waiting, VIOLATIONS_PAGE_SIZE);
  const cards = await db
    .select({
      id: dormViolationAppeals.id,
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      sentAt: dormViolationAppeals.sentAt,
      reason: dormViolationAppeals.reason,
      proofName: dormViolationAppeals.fileName,
      violationDay: dormViolations.day,
      violationReason: dormViolations.reason,
      punishment: dormViolations.punishment,
      otherPunishment: dormViolations.otherPunishment,
    })
    .from(dormViolationAppeals)
    .innerJoin(
      dormViolations,
      eq(dormViolations.id, dormViolationAppeals.violationId),
    )
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(and(WAITING, visible))
    .orderBy(asc(dormViolationAppeals.sentAt), asc(dormViolationAppeals.id))
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  return { waiting, cards, page: shown };
}
