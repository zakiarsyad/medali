// Sample Tahun akademik of this file: 4478 to 4478.
// Sample NIMs of this file: 9987708000 to 9987708099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { coachingStatuses, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { coachingLimitOf } from "./coaching-reach";
import { readStudentCoaching } from "./student-coaching";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  addCoachingStatus,
  INTENSIVE,
  LIGHT,
  MODERATE,
  NOT_LISTED,
} from "./test-coaching";
import { addPenaltyGroup, addTestPenalty } from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const FIRST = new Date("4478-09-01T03:00:00Z");
const LATER = new Date("4478-09-10T03:00:00Z");

/** Not listed as saved, Sedang once its 90s are held at 70 under a penalty. */
const LISTED_ONLY_WHEN_HELD: Scores = {
  M: 90,
  E: 90,
  D: 60,
  A: 60,
  L: 59,
  I: 60,
};

interface Setting {
  kepala: AccountForAccess;
  /** Prodi A: 1 Intensif, 2 Sedang, 3 Ringan, 4 not listed, 5 never assessed. */
  inA: string[];
  /** Prodi B: 1 Intensif, 2 not listed. */
  inB: [string, string];
  programA: number;
  periodId: string;
}

async function setting(db: Database): Promise<Setting> {
  const periodId = await addCoachingPeriod(db, 4478);
  const a = await addNoteStudents(
    db,
    "Prodi Uji Rincian Pembinaan A",
    "Mahasiswa Uji Rincian Pembinaan A",
    ["9987708001", "9987708002", "9987708003", "9987708004", "9987708005"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Rincian Pembinaan B",
    "Mahasiswa Uji Rincian Pembinaan B",
    ["9987708011", "9987708012"],
  );
  const kepala = await addNoteActor(db, "Kepala Uji Rincian Pembinaan", [
    "head_of_unit",
  ]);
  const assessed: Array<[string | undefined, Scores]> = [
    [a.studentIds[0], INTENSIVE],
    [a.studentIds[1], MODERATE],
    [a.studentIds[2], LIGHT],
    [a.studentIds[3], NOT_LISTED],
    [b.studentIds[0], INTENSIVE],
    [b.studentIds[1], NOT_LISTED],
  ];
  for (const [studentId = "", scores] of assessed) {
    await addCoachingAssessment(
      db,
      studentId,
      kepala.id,
      periodId,
      scores,
      FIRST,
    );
  }
  const [inB1 = "", inB2 = ""] = b.studentIds;
  return {
    kepala,
    inA: a.studentIds,
    inB: [inB1, inB2],
    programA: a.programId,
    periodId,
  };
}

function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(
    db,
    "Pembaca Uji Rincian Pembinaan",
    roles,
    programId ?? null,
  );
}

function accountOf(roles: RoleId[]): AccountForAccess {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    roles,
    studyProgramId: null,
    studentId: null,
  };
}

/** Every role that does not open Pembinaan karakter on its own. */
const OTHER_ROLES = ROLE_IDS.filter(
  (role) => coachingLimitOf(accountOf([role])) === null,
);

describe("readStudentCoaching", () => {
  it("gives the level, the weakest value, the status and its note of a listed student", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);
      const [one = "", two = "", three = ""] = inA;
      await addCoachingStatus(db, two, kepala.id, "monitoring", "Dipantau.");

      expect(await readStudentCoaching(db, kepala, one)).toEqual({
        level: "intensive",
        weakest: "M",
        status: "identified",
        note: "",
      });
      expect(await readStudentCoaching(db, kepala, two)).toEqual({
        level: "moderate",
        weakest: "A",
        status: "monitoring",
        note: "Dipantau.",
      });
      expect(await readStudentCoaching(db, kepala, three)).toEqual({
        level: "light",
        weakest: "D",
        status: "identified",
        note: "",
      });
    });
  });

  it("gives nothing for a student above both limits, and for one never assessed", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);

      expect(await readStudentCoaching(db, kepala, inA[3] ?? "")).toBeNull();
      expect(await readStudentCoaching(db, kepala, inA[4] ?? "")).toBeNull();
    });
  });

  it("still gives a student whose status is Selesai", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);
      const [one = ""] = inA;
      await addCoachingStatus(db, one, kepala.id, "done", "Sudah membaik.");

      expect(await readStudentCoaching(db, kepala, one)).toEqual(
        expect.objectContaining({ status: "done", note: "Sudah membaik." }),
      );
    });
  });

  it("shows a new status, note and assessment on the next read", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, periodId } = await setting(db);
      const [one = "", two = "", , four = ""] = inA;
      await addCoachingStatus(db, one, kepala.id, "counselling", "Dipanggil.");
      expect(await readStudentCoaching(db, kepala, one)).toEqual(
        expect.objectContaining({ status: "counselling", note: "Dipanggil." }),
      );

      await db
        .update(coachingStatuses)
        .set({ status: "monitoring", note: "Dipantau tiap pekan." })
        .where(eq(coachingStatuses.studentId, one));
      await addCoachingAssessment(db, two, kepala.id, periodId, LIGHT, LATER);
      await addCoachingAssessment(
        db,
        four,
        kepala.id,
        periodId,
        INTENSIVE,
        LATER,
      );

      expect(await readStudentCoaching(db, kepala, one)).toEqual(
        expect.objectContaining({
          status: "monitoring",
          note: "Dipantau tiap pekan.",
        }),
      );
      expect(await readStudentCoaching(db, kepala, two)).toEqual(
        expect.objectContaining({ level: "light", weakest: "D" }),
      );
      expect(await readStudentCoaching(db, kepala, four)).toEqual(
        expect.objectContaining({ level: "intensive" }),
      );

      await addCoachingAssessment(
        db,
        one,
        kepala.id,
        periodId,
        NOT_LISTED,
        LATER,
      );
      expect(await readStudentCoaching(db, kepala, one)).toBeNull();
    });
  });

  it("reads the scores held at 70 under a Ringan penalty, as the list does", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, periodId } = await setting(db);
      const [, , , four = ""] = inA;
      await addCoachingAssessment(
        db,
        four,
        kepala.id,
        periodId,
        LISTED_ONLY_WHEN_HELD,
        LATER,
      );
      expect(await readStudentCoaching(db, kepala, four)).toBeNull();

      await addTestPenalty(db, four, kepala.id, "4478-09-12");

      expect(await readStudentCoaching(db, kepala, four)).toEqual(
        expect.objectContaining({ level: "moderate", weakest: "L" }),
      );
    });
  });

  it("gives nothing for a student on Cuti or Non aktif", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);
      const [one = "", two = ""] = inA;
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, one));
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(eq(students.id, two));

      expect(await readStudentCoaching(db, kepala, one)).toBeNull();
      expect(await readStudentCoaching(db, kepala, two)).toBeNull();
    });
  });

  it("gives Direktur every listed student", async () => {
    await inTestDatabase(async (db) => {
      const { inB } = await setting(db);
      const director = await reader(db, ["director"]);

      expect(await readStudentCoaching(db, director, inB[0])).toEqual(
        expect.objectContaining({ level: "intensive" }),
      );
    });
  });

  it("keeps Ketua Program Studi to their own program, with the same answer whether or not the student outside is listed", async () => {
    await inTestDatabase(async (db) => {
      const { inA, inB, programA } = await setting(db);
      const kaprodi = await reader(db, ["head_of_program"], programA);

      const listedOutside = await readStudentCoaching(db, kaprodi, inB[0]);
      const notListedOutside = await readStudentCoaching(db, kaprodi, inB[1]);

      expect(await readStudentCoaching(db, kaprodi, inA[0] ?? "")).toEqual(
        expect.objectContaining({ level: "intensive" }),
      );
      expect(listedOutside).toBeNull();
      expect(listedOutside).toEqual(notListedOutside);
    });
  });

  it("keeps Pengasuh to their own mentees, with the same answer whether or not the student outside is listed", async () => {
    await inTestDatabase(async (db) => {
      const { inA, programA } = await setting(db);
      const [one = "", two = "", , four = ""] = inA;
      const mentor = await reader(db, ["mentor"]);
      await addPenaltyGroup(db, programA, [one], mentor.id);

      const listedOutside = await readStudentCoaching(db, mentor, two);
      const notListedOutside = await readStudentCoaching(db, mentor, four);

      expect(await readStudentCoaching(db, mentor, one)).toEqual(
        expect.objectContaining({ level: "intensive" }),
      );
      expect(listedOutside).toBeNull();
      expect(listedOutside).toEqual(notListedOutside);
    });
  });

  it("keeps a Ketua Program Studi who is also Konselor to their own program", async () => {
    await inTestDatabase(async (db) => {
      const { inB, programA } = await setting(db);
      const both = await reader(
        db,
        ["head_of_program", "counsellor"],
        programA,
      );

      expect(await readStudentCoaching(db, both, inB[0])).toBeNull();
    });
  });

  it("names Konselor, Penilai Mahasiswa, Pembina Disiplin Mahasiswa, Mahasiswa and the BAM roles among the other roles", () => {
    expect(OTHER_ROLES).toEqual(
      expect.arrayContaining([
        "counsellor",
        "assessor",
        "discipline_officer",
        "student",
        "bam_bphk",
        "bam_health",
      ]),
    );
    expect(OTHER_ROLES).not.toContain("head_of_unit");
    expect(OTHER_ROLES).not.toContain("director");
    expect(OTHER_ROLES).not.toContain("head_of_program");
    expect(OTHER_ROLES).not.toContain("mentor");
  });

  it.each(OTHER_ROLES)("gives %s nothing, listed or not", async (role) => {
    await inTestDatabase(async (db) => {
      const { inA } = await setting(db);
      const asking = await reader(db, [role]);

      expect(await readStudentCoaching(db, asking, inA[0] ?? "")).toBeNull();
      expect(await readStudentCoaching(db, asking, inA[3] ?? "")).toBeNull();
    });
  });

  it("gives a student nothing of their own", async () => {
    await inTestDatabase(async (db) => {
      const { inA } = await setting(db);
      const own = {
        ...(await reader(db, ["student"])),
        studentId: inA[0] ?? null,
      };

      expect(await readStudentCoaching(db, own, inA[0] ?? "")).toBeNull();
    });
  });

  it("gives nothing for a removed student, and for a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);
      const [one = ""] = inA;
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, one));

      expect(await readStudentCoaching(db, kepala, one)).toBeNull();
      expect(await readStudentCoaching(db, kepala, "bukan-id")).toBeNull();
    });
  });
});

describe("readStudentCoaching for an account outside Pembinaan karakter", () => {
  it("asks the database nothing", async () => {
    const untouched = new Proxy({} as Database, {
      get: () => {
        throw new Error("The database was asked.");
      },
    });

    expect(
      await readStudentCoaching(
        untouched,
        accountOf(["counsellor"]),
        "00000000-0000-4000-8000-000000000001",
      ),
    ).toBeNull();
  });
});
