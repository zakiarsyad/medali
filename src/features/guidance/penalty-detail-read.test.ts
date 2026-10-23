// Sample Tahun akademik of this file: 4434 to 4434.
// Sample NIMs of this file: 9944310000 to 9944310099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readPenaltyDetail } from "./penalty-detail-read";
import { addPenaltyGroup, addTestPenalty } from "./test-discipline-penalties";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

interface Setting {
  officer: AccountForAccess;
  /** A Berat pertama penalty of Mahasiswa Uji Rincian A 1, with an Instansi asal. */
  penaltyA: string;
  /** A penalty of Mahasiswa Uji Rincian B 1. */
  penaltyB: string;
  studentA: string;
  programA: number;
}

async function setting(db: Database): Promise<Setting> {
  await addNotePeriods(db, 4434);
  const a = await addNoteStudents(
    db,
    "Prodi Uji Rincian A",
    "Mahasiswa Uji Rincian A",
    ["9944310001"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Rincian B",
    "Mahasiswa Uji Rincian B",
    ["9944310011"],
  );
  const studentA = a.studentIds[0] ?? "";
  await db
    .update(students)
    .set({ cohortYear: 4433, originAgency: "Instansi Uji" })
    .where(eq(students.id, studentA));
  const officer = await addNoteActor(db, "Pembina Uji Rincian", [
    "discipline_officer",
  ]);
  const penaltyA = await addTestPenalty(
    db,
    studentA,
    officer.id,
    "4434-10-01",
    {
      category: "heavy",
      level: 1,
      decisionNumber: "KEP-02/UJI",
      socialWorkForms: ["staff_help", "other"],
      socialWorkOther: "Menata arsip",
      socialWorkPlace: "outside",
      socialWorkStartsOn: "4434-10-02",
      socialWorkEndsOn: "4435-06-01",
      conditionsMet: ["served"],
    },
  );
  const penaltyB = await addTestPenalty(
    db,
    b.studentIds[0] ?? "",
    officer.id,
    "4434-10-03",
  );
  return { officer, penaltyA, penaltyB, studentA, programA: a.programId };
}

function reader(
  db: Database,
  roles: RoleId[],
  programId: number | null = null,
) {
  return addNoteActor(db, "Pembaca Uji Rincian", roles, programId);
}

describe("readPenaltyDetail", () => {
  it("gives Pembina Disiplin Mahasiswa all that Rincian shows of one penalty", async () => {
    await inTestDatabase(async (db) => {
      const { officer, penaltyA } = await setting(db);

      expect(await readPenaltyDetail(db, officer, penaltyA)).toStrictEqual({
        id: penaltyA,
        name: "Mahasiswa Uji Rincian A 1",
        description: "Terlambat mengikuti apel pagi tiga kali",
        category: "heavy",
        level: 1,
        status: "imposed",
        decisionNumber: "KEP-02/UJI",
        socialWorkForms: ["staff_help", "other"],
        socialWorkOther: "Menata arsip",
        socialWorkPlace: "outside",
        socialWorkStartsOn: "4434-10-02",
        socialWorkEndsOn: "4435-06-01",
        savedByName: "Pembina Uji Rincian",
        semester: 3,
        conditionsMet: ["served"],
        decision: "pending",
        version: 1,
        hasAgency: true,
      });
    });
  });

  it.each<RoleId>(["head_of_unit", "director"])(
    "gives %s any penalty",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { penaltyA, penaltyB } = await setting(db);
        const other = await reader(db, [role]);

        expect(await readPenaltyDetail(db, other, penaltyA)).toEqual(
          expect.objectContaining({
            id: penaltyA,
            decisionNumber: "KEP-02/UJI",
          }),
        );
        expect(await readPenaltyDetail(db, other, penaltyB)).toEqual(
          expect.objectContaining({ id: penaltyB }),
        );
      });
    },
  );

  it("gives Ketua Program Studi a penalty of their own program, and nothing of another", async () => {
    await inTestDatabase(async (db) => {
      const { penaltyA, penaltyB, programA } = await setting(db);
      const kaprodi = await reader(db, ["head_of_program"], programA);

      expect(await readPenaltyDetail(db, kaprodi, penaltyA)).toEqual(
        expect.objectContaining({ id: penaltyA }),
      );
      expect(await readPenaltyDetail(db, kaprodi, penaltyB)).toBeNull();
    });
  });

  it("gives Pengasuh a penalty of their own mentee, and nothing of another student", async () => {
    await inTestDatabase(async (db) => {
      const { penaltyA, penaltyB, studentA, programA } = await setting(db);
      const mentor = await reader(db, ["mentor"]);
      await addPenaltyGroup(db, programA, [studentA], mentor.id);

      expect(await readPenaltyDetail(db, mentor, penaltyA)).toEqual(
        expect.objectContaining({ id: penaltyA }),
      );
      expect(await readPenaltyDetail(db, mentor, penaltyB)).toBeNull();
    });
  });

  it.each<RoleId>([
    "student",
    "counsellor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_bphk",
  ])("gives %s nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { penaltyA } = await setting(db);
      const other = await reader(db, [role]);

      expect(await readPenaltyDetail(db, other, penaltyA)).toBeNull();
    });
  });

  it.each([
    ["a made-up key", "6f1c1d1e-0000-4000-8000-000000000000"],
    ["a text that is no key", "bukan-kunci"],
    ["nothing", ""],
  ])("gives nothing for %s", async (_kind, asked) => {
    await inTestDatabase(async (db) => {
      const { officer } = await setting(db);

      expect(await readPenaltyDetail(db, officer, asked)).toBeNull();
    });
  });
});
