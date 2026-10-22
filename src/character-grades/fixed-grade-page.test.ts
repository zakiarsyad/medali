// Sample Tahun akademik of this file: 5140 to 5140.
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { START_PARAMS } from "@/features/character-grades/grade-address";
import { readClosedPeriods } from "./closed-semesters";
import {
  readFixedGradeNumbers,
  readFixedGradePage,
  readFixedSikuBase,
} from "./fixed-grade-page";
import type { GradeRow } from "./grade-list";
import { keepClosing } from "./keep-closing";
import { type GradeScheme, STARTING_SCHEME } from "./scheme-ids";

/*
 * This file's own sample values: the Tahun akademik 5140, the program
 * UJIBACATETAP, and the NIMs 9951350000 to 9951350099.
 */

const inTestDatabase = withTestDatabase();

const OPENS = sql`true`;

const C_TO_PASS: GradeScheme = { ...STARTING_SCHEME, passLetter: "C" };

interface Kept {
  periodId: string;
  closingId: string;
  kepalaId: string;
  rows: GradeRow[];
}

function rowOf(
  student: { id: string; name: string; nim: string },
  more: Partial<GradeRow> = {},
): GradeRow {
  return {
    student: { ...student, program: "UJIBACATETAP" },
    attendance: { percent: 90, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 65, adjusted: false, note: "SIKU dasar 65" },
    skpm: 72,
    grade: { complete: true, final: 76.8, letter: "B", passes: true },
    limited: false,
    ...more,
  };
}

/** Four students of one program and the closing that fixed their grades. */
async function addClosing(db: Database): Promise<Kept> {
  const periods = await addTestPeriods(db, 5140);
  const programId = await addTestProgram(db, "UJIBACATETAP");
  const kepala = await addTestActor(db, "Kepala Uji Baca Tetap", [
    "head_of_unit",
  ]);
  const student = async (nim: string, name: string) => {
    const added = await addTestStudentAccount(db, programId, {
      nim,
      name,
      cohortYear: 5139,
    });
    return { id: added.studentId, name, nim };
  };
  const ani = await student("9951350001", "Ani Uji Baca Tetap");
  const budi = await student("9951350002", "Budi Uji Baca Tetap");
  const cici = await student("9951350003", "Cici Uji Baca Tetap");
  const dodi = await student("9951350004", "Dodi Uji Baca Tetap");
  const rows = [
    rowOf(ani, {
      siku: { score: 70, adjusted: true, note: "SIKU 65 +5" },
      grade: { complete: true, final: 80.5, letter: "B", passes: true },
    }),
    rowOf(budi, {
      grade: {
        complete: true,
        final: 70,
        letter: "B",
        passes: true,
        limitedFrom: 88.9,
      },
      limited: true,
    }),
    rowOf(cici, {
      attendance: { percent: null, attended: 0, counted: 0 },
      mentoring: null,
      grade: { complete: false },
    }),
    rowOf(dodi, {
      grade: { complete: true, final: 55.2, letter: "E", passes: false },
    }),
  ];
  await keepClosing(db, {
    periodId: periods.oddId,
    closedBy: kepala.id,
    scheme: C_TO_PASS,
    rows,
  });
  const [closing] = await readClosedPeriods(db);
  if (!closing) throw new Error("The closing was not kept.");
  return {
    periodId: periods.oddId,
    closingId: closing.closingId,
    kepalaId: kepala.id,
    rows,
  };
}

describe("readFixedGradePage", () => {
  it("gives the rows the closing kept, by name, each part, Nilai akhir, Huruf and Keterangan as they were", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);

      const list = await readFixedGradePage(
        db,
        NOT_REMOVED,
        OPENS,
        kept.closingId,
        START_PARAMS,
      );

      expect(list).toEqual({
        rows: kept.rows,
        matching: 4,
        page: 1,
        nameOnly: [],
      });
    });
  });

  it("gives nothing of a period that has no closing", async () => {
    await inTestDatabase(async (db) => {
      await addClosing(db);

      const list = await readFixedGradePage(
        db,
        NOT_REMOVED,
        OPENS,
        "00000000-0000-4000-8000-000000000000",
        START_PARAMS,
      );

      expect(list).toEqual({ rows: [], matching: 0, page: 1, nameOnly: [] });
    });
  });
});

describe("readFixedGradeNumbers", () => {
  it("counts the fixed grades as the live numbers are counted", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);

      const numbers = await readFixedGradeNumbers(
        db,
        NOT_REMOVED,
        kept.closingId,
      );

      expect(numbers).toEqual({
        students: 4,
        // (80.5 + 70 + 55.2) / 3 is 68.57: Belum lengkap is left out.
        meanFinal: 68.6,
        complete: 3,
        passing: 2,
        adjusted: 1,
        incomplete: 1,
        limited: 1,
      });
    });
  });
});

describe("readFixedSikuBase", () => {
  it("is the SIKU of a student without an entry when the closing was made", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);

      expect(await readFixedSikuBase(db, kept.closingId)).toBe(65);
    });
  });

  it("is unknown for a closing that kept nobody", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, 5140);
      const kepala = await addTestActor(db, "Kepala Uji Kosong", [
        "head_of_unit",
      ]);
      await keepClosing(db, {
        periodId: periods.evenId,
        closedBy: kepala.id,
        scheme: STARTING_SCHEME,
        rows: [],
      });
      const [closing] = await readClosedPeriods(db);
      if (!closing) throw new Error("The closing was not kept.");

      expect(await readFixedSikuBase(db, closing.closingId)).toBeNull();
    });
  });
});
