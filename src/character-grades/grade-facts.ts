import { and, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentoringScores, students } from "@/db/schema";
import {
  type AttendanceBasis,
  attendanceSums,
  readAttendanceBasis,
} from "@/features/activities/attendance-sums";
import type { GradeScheme } from "@/features/character-grades/scheme-ids";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { totalsByStudent as sikuTotalsByStudent } from "@/features/siku/siku-totals";
import { readConversion } from "@/features/skpm/skpm-conversion";
import {
  countUploadsInForce,
  totalsByStudent as skpmTotalsByStudent,
} from "@/features/skpm/skpm-totals";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { finalSql, passesSql, percentSql, sikuSql, skpmSql } from "./grade-sql";

/** What the grades of many students are worked out with, read first. */
export interface GradeBasis {
  scheme: GradeScheme;
  sikuBase: number;
  pointsForHundred: number;
  skpmUploads: number;
  /** Null with no running period: then nobody has Kehadiran or Pengasuhan. */
  attendance: AttendanceBasis | null;
}

export async function readGradeBasis(
  db: Database,
  scheme: GradeScheme,
  today: string,
): Promise<GradeBasis> {
  const [base, conversion, skpmUploads, attendance] = await Promise.all([
    readBaseScore(db),
    readConversion(db),
    countUploadsInForce(db),
    readAttendanceBasis(db, today),
  ]);
  return {
    scheme,
    sikuBase: base.score,
    pointsForHundred: conversion.pointsForHundred,
    skpmUploads,
    attendance,
  };
}

const NONE = sql`null`;

function attendancePart(
  db: Database,
  visible: SQL,
  basis: AttendanceBasis | null,
) {
  if (basis === null) return { table: null, percent: NONE };
  const table = attendanceSums(db, visible, basis);
  return { table, percent: percentSql(table.attended, table.counted) };
}

/** Pengasuhan joins only the score of the running period. */
function mentoringOfPeriod(basis: AttendanceBasis | null): SQL {
  if (basis === null) return sql`false`;
  return (
    and(
      eq(mentoringScores.studentId, students.id),
      eq(mentoringScores.periodId, basis.period.id),
    ) ?? sql`false`
  );
}

/**
 * Each Aktif student `visible` lets through with what the list filters
 * and counts by, as a table to read from: Nilai akhir, or null while a
 * part is missing, whether it passes, and whether an entry in force gave
 * or took SIKU points. Every part is worked out in the database from
 * where it is recorded, as the server would.
 */
export function gradeFacts(db: Database, visible: SQL, basis: GradeBasis) {
  const attendance = attendancePart(db, visible, basis.attendance);
  const siku = sikuTotalsByStudent(db);
  const skpm = skpmTotalsByStudent(db);
  const gains = sql`coalesce(${siku.gains}, 0)`;
  const losses = sql`coalesce(${siku.losses}, 0)`;
  // A student with no row in force has 0 once an upload counts.
  const skpmPart =
    basis.skpmUploads === 0
      ? NONE
      : skpmSql(sql`coalesce(${skpm.total}, 0)`, basis.pointsForHundred);
  const final = finalSql(
    {
      attendance: attendance.percent,
      mentoring: sql`${mentoringScores.score}`,
      siku: sikuSql(basis.sikuBase, gains, losses),
      skpm: skpmPart,
    },
    basis.scheme.weights,
  );
  const query = db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      final: sql<number | null>`${final}`.as("final"),
      passes: sql<boolean | null>`${passesSql(final, basis.scheme)}`.as(
        "passes",
      ),
      adjusted: sql<boolean>`(${gains} > 0 or ${losses} > 0)`.as("adjusted"),
    })
    .from(students)
    .leftJoin(siku, eq(siku.studentId, students.id))
    .leftJoin(skpm, eq(skpm.studentId, students.id))
    .leftJoin(mentoringScores, mentoringOfPeriod(basis.attendance))
    .$dynamic();
  const table = attendance.table;
  const joined = table
    ? query.leftJoin(table, eq(table.studentId, students.id))
    : query;
  return joined.where(and(ACTIVE_MEMBER, visible)).as("grade_facts");
}
