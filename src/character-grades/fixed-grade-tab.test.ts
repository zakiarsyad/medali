// Sample Tahun akademik of this file: 5150 to 5150.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestMentorGroup,
  addTestPeriods,
  addTestProgram,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeParams,
  START_PARAMS,
} from "@/features/character-grades/grade-address";
import { readClosedPeriods } from "./closed-semesters";
import { type FixedGradeTab, readFixedGradeTab } from "./fixed-grade-tab";
import type { GradeRow } from "./grade-list";
import { keepClosing } from "./keep-closing";
import { STARTING_SCHEME } from "./scheme-ids";

/*
 * This file's own sample values: the Tahun akademik 5150, the programs
 * UJITABTETAP and UJITABLAIN, and the NIMs 9951360000 to 9951360099.
 */

const inTestDatabase = withTestDatabase();

/** How many students of the own program the closing kept. */
const OWN_COUNT = 30;

type Student = { id: string; name: string; nim: string };

/** Every third grade is Belum lengkap, the next one fails, the next passes. */
function rowOf(student: Student, index: number): GradeRow {
  const base: GradeRow = {
    student: { ...student, program: "-" },
    attendance: { percent: 90, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 65, adjusted: false, note: "SIKU dasar 65" },
    skpm: 72,
    grade: { complete: true, final: 76.8, letter: "B", passes: true },
    limited: false,
  };
  if (index % 3 === 0) {
    return { ...base, mentoring: null, grade: { complete: false } };
  }
  if (index % 3 === 1) {
    return {
      ...base,
      grade: { complete: true, final: 45, letter: "E", passes: false },
    };
  }
  return base;
}

async function addClosing(db: Database) {
  const periods = await addTestPeriods(db, 5150);
  const own = await addTestProgram(db, "UJITABTETAP");
  const other = await addTestProgram(db, "UJITABLAIN");
  const kepala = await addTestActor(db, "Kepala Uji Tab Tetap", [
    "head_of_unit",
  ]);
  const add = async (programId: number, number: number): Promise<Student> => {
    const nim = `99513600${String(number).padStart(2, "0")}`;
    const name = `Mahasiswa Uji Tab ${String(number).padStart(2, "0")}`;
    const added = await addTestStudentAccount(db, programId, {
      nim,
      name,
      cohortYear: 5149,
    });
    return { id: added.studentId, name, nim };
  };
  const ownStudents: Student[] = [];
  for (let number = 1; number <= OWN_COUNT; number += 1) {
    ownStudents.push(await add(own, number));
  }
  const otherStudent = await add(other, 50);
  const kept = [...ownStudents, otherStudent];
  await keepClosing(db, {
    periodId: periods.oddId,
    closedBy: kepala.id,
    scheme: STARTING_SCHEME,
    rows: kept.map(rowOf),
  });
  const [first, second, third] = ownStudents;
  if (!first || !second || !third) throw new Error("Too few students.");
  // The first has left the campus since the closing.
  await db
    .update(students)
    .set({ status: "inactive" })
    .where(eq(students.id, first.id));
  const mentor = await addTestActor(db, "Pengasuh Uji Tab Tetap", ["mentor"]);
  await addTestMentorGroup(db, {
    studyProgramId: own,
    cohortYear: 5149,
    number: 1,
    mentorId: mentor.id,
    memberIds: [first.id, second.id],
  });
  const [closing] = await readClosedPeriods(db);
  if (!closing) throw new Error("The closing was not kept.");
  return {
    closingId: closing.closingId,
    own,
    other,
    kepala,
    mentor,
    left: first,
    mentee: second,
    outside: third,
    otherStudent,
  };
}

function accountOf(
  id: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id, roles, studyProgramId, studentId: null };
}

async function shown(
  db: Database,
  account: AccountForAccess,
  closingId: string,
  params: Partial<GradeParams> = {},
): Promise<FixedGradeTab> {
  const tab = await readFixedGradeTab(db, account, closingId, {
    ...START_PARAMS,
    ...params,
  });
  if (tab === "refused") throw new Error("The fixed grades were refused.");
  return tab;
}

function nimsOf(tab: FixedGradeTab): string[] {
  return tab.list.rows.map((row) => row.student.nim);
}

describe("the fixed grades of a closed semester, a page at a time", () => {
  it("shows 25 a page, by name, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const kepala = accountOf(kept.kepala.id, ["head_of_unit"]);

      const first = await shown(db, kepala, kept.closingId);
      const second = await shown(db, kepala, kept.closingId, { page: 2 });
      const past = await shown(db, kepala, kept.closingId, { page: 99 });

      expect(first.list.rows).toHaveLength(GRADE_LIST_PAGE_SIZE);
      expect(first.list.matching).toBe(OWN_COUNT + 1);
      expect(nimsOf(first)[0]).toBe("9951360001");
      expect(second.list.rows).toHaveLength(OWN_COUNT + 1 - 25);
      expect(second.list.page).toBe(2);
      expect(past.list.page).toBe(2);
      expect(nimsOf(past)).toEqual(nimsOf(second));
    });
  });

  it("searches the fixed grades by name or NIM", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const kepala = accountOf(kept.kepala.id, ["head_of_unit"]);

      const byName = await shown(db, kepala, kept.closingId, {
        query: "uji tab 07",
      });
      const byNim = await shown(db, kepala, kept.closingId, {
        query: "36000",
      });

      expect(nimsOf(byName)).toEqual(["9951360007"]);
      expect(byNim.list.matching).toBe(9);
    });
  });

  it("filters Belum memenuhi batas lulus and Belum lengkap on the fixed grades", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const kepala = accountOf(kept.kepala.id, ["head_of_unit"]);

      const failing = await shown(db, kepala, kept.closingId, {
        filter: "failing",
      });
      const incomplete = await shown(db, kepala, kept.closingId, {
        filter: "incomplete",
      });

      // Of the 31 kept, numbered 0 to 30 in the closing: 11 at 0, 3, …, 30
      // are Belum lengkap, and 10 at 1, 4, …, 28 fail.
      expect(incomplete.list.matching).toBe(11);
      expect(failing.list.matching).toBe(10);
      for (const row of failing.list.rows) {
        expect(row.grade).toMatchObject({ complete: true, passes: false });
      }
      for (const row of incomplete.list.rows) {
        expect(row.grade.complete).toBe(false);
        expect(row.mentoring).toBeNull();
      }
    });
  });
});

describe("who sees which fixed grades", () => {
  it("shows a role that reads every student each fixed row, also of one who has left", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);

      for (const roles of [
        ["head_of_unit"],
        ["director"],
        ["assessor"],
      ] satisfies RoleId[][]) {
        const tab = await shown(
          db,
          accountOf(kept.kepala.id, roles),
          kept.closingId,
          { query: kept.left.nim },
        );
        expect(nimsOf(tab)).toEqual([kept.left.nim]);
        expect(tab.numbers.students).toBe(OWN_COUNT + 1);
      }
    });
  });

  it("shows Ketua Program Studi the students whose program today is theirs, also one who has left, and no other", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const ketua = accountOf(kept.kepala.id, ["head_of_program"], kept.own);
      const otherKetua = accountOf(
        kept.kepala.id,
        ["head_of_program"],
        kept.other,
      );

      const own = await shown(db, ketua, kept.closingId, { page: 2 });
      const asked = await shown(db, ketua, kept.closingId, {
        query: kept.otherStudent.nim,
      });
      const other = await shown(db, otherKetua, kept.closingId, {
        query: kept.left.nim,
      });

      expect(own.list.matching).toBe(OWN_COUNT);
      expect(own.numbers.students).toBe(OWN_COUNT);
      expect(asked.list.rows).toEqual([]);
      expect(other.list.rows).toEqual([]);
      // Only the one student of the other program.
      expect(other.numbers.students).toBe(1);
    });
  });

  it("shows Pengasuh their mentees today only, and nothing of another student asked for by hand", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const mentor = accountOf(kept.mentor.id, ["mentor"]);

      const all = await shown(db, mentor, kept.closingId);
      const asked = await shown(db, mentor, kept.closingId, {
        query: kept.outside.nim,
      });

      expect(nimsOf(all)).toEqual([kept.left.nim, kept.mentee.nim]);
      expect(all.numbers.students).toBe(2);
      expect(asked.list.rows).toEqual([]);
      expect(asked.list.matching).toBe(0);
    });
  });

  it("refuses Mahasiswa, Konselor, Pegawai UPK and every BAM role", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const refused: RoleId[] = [
        "student",
        "counsellor",
        "upk_staff",
        "bam_bphk",
        "bam_compliance",
        "bam_household",
        "bam_spiritual",
        "bam_catering",
        "bam_arts_sports",
        "bam_health",
      ];

      for (const role of refused) {
        const tab = await readFixedGradeTab(
          db,
          accountOf(kept.kepala.id, [role]),
          kept.closingId,
          { ...START_PARAMS, query: kept.mentee.nim },
        );
        expect(tab, role).toBe("refused");
      }
    });
  });
});

describe("names in the fixed grades", () => {
  it("open a student the role may open, and show one who has left as a name only to a role without the student detail", async () => {
    await inTestDatabase(async (db) => {
      const kept = await addClosing(db);
      const kepala = accountOf(kept.kepala.id, ["head_of_unit"]);
      const assessor = accountOf(kept.kepala.id, ["assessor"]);

      const forKepala = await shown(db, kepala, kept.closingId);
      const forAssessor = await shown(db, assessor, kept.closingId);

      expect(forKepala.list.nameOnly).toEqual([]);
      expect(forAssessor.list.nameOnly).toEqual([kept.left.id]);
    });
  });
});
