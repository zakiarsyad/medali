// Sample NIMs of this file: 9944400000 to 9944400099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, may } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { ROLES } from "@/auth/roles";
import type { Database } from "@/db/connect";
import { disciplinePenalties, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readDetailOrBrief } from "@/features/students/student-brief";
import {
  penalisedReachOf,
  readRecordAddress,
  readStudentPenalties,
} from "./student-penalties";
import {
  addPenaltyGroup,
  addTestPenalty,
  NO_SOCIAL_WORK,
} from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

interface Setting {
  officer: AccountForAccess;
  /** Students of Prodi A: Mahasiswa Uji Riwayat A 1 and 2. */
  inA: [string, string];
  /** A student of Prodi B: Mahasiswa Uji Riwayat B 1. */
  inB: string;
  programA: number;
  programB: number;
}

async function setting(db: Database): Promise<Setting> {
  const a = await addNoteStudents(
    db,
    "Prodi Uji Riwayat A",
    "Mahasiswa Uji Riwayat A",
    ["9944400001", "9944400002"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Riwayat B",
    "Mahasiswa Uji Riwayat B",
    ["9944400011"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Riwayat", [
    "discipline_officer",
  ]);
  const [one = "", two = ""] = a.studentIds;
  return {
    officer,
    inA: [one, two],
    inB: b.studentIds[0] ?? "",
    programA: a.programId,
    programB: b.programId,
  };
}

function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(db, "Pembaca Uji Riwayat", roles, programId ?? null);
}

/** The roles that may not read discipline records, every one of them. */
const NOT_READERS = ROLE_IDS.filter(
  (role) => !ROLES[role].actions.includes("view_discipline_records"),
);

describe("readStudentPenalties", () => {
  it("gives every penalty of the student, the newest first, with what the panel shows", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      const [one, two] = inA;
      const older = await addTestPenalty(db, one, officer.id, "2026-09-01");
      const newer = await addTestPenalty(db, one, officer.id, "2026-10-01", {
        category: "heavy",
        level: 2,
        status: "set",
        description: "Memalsukan tanda tangan dosen",
        ...NO_SOCIAL_WORK,
      });
      await addTestPenalty(db, two, officer.id, "2026-10-02");

      const found = await readStudentPenalties(
        db,
        await reader(db, ["director"]),
        one,
      );

      expect(found).toEqual([
        {
          id: newer,
          day: "2026-10-01",
          category: "heavy",
          level: 2,
          status: "set",
          description: "Memalsukan tanda tangan dosen",
          hasSocialWork: false,
        },
        {
          id: older,
          day: "2026-09-01",
          category: "light",
          level: 1,
          status: "imposed",
          description: "Terlambat mengikuti apel pagi tiga kali",
          hasSocialWork: true,
        },
      ]);
    });
  });

  it("gives none for a student without a penalty", async () => {
    await inTestDatabase(async (db) => {
      const { inA } = await setting(db);

      expect(
        await readStudentPenalties(
          db,
          await reader(db, ["head_of_unit"]),
          inA[0],
        ),
      ).toEqual([]);
    });
  });

  it("shows the new status after a follow-up, and a penalty added later, on the next read", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      const head = await reader(db, ["head_of_unit"]);
      const id = await addTestPenalty(db, inA[0], officer.id, "2026-09-01");
      expect(await readStudentPenalties(db, head, inA[0])).toHaveLength(1);

      await db
        .update(disciplinePenalties)
        .set({ status: "served" })
        .where(eq(disciplinePenalties.id, id));
      await addTestPenalty(db, inA[0], officer.id, "2026-10-01");

      const found = await readStudentPenalties(db, head, inA[0]);
      expect(found?.map((penalty) => penalty.status)).toEqual([
        "imposed",
        "served",
      ]);
    });
  });

  it("keeps Ketua Program Studi to their own program", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB, programA } = await setting(db);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");
      await addTestPenalty(db, inB, officer.id, "2026-09-01");
      const head = await reader(db, ["head_of_program"], programA);

      expect(await readStudentPenalties(db, head, inA[0])).toHaveLength(1);
      expect(await readStudentPenalties(db, head, inB)).toEqual([]);
    });
  });

  it("keeps Pengasuh to their own mentees", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, programA } = await setting(db);
      const mentor = await reader(db, ["mentor"]);
      await addPenaltyGroup(db, programA, [inA[0]], mentor.id);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");
      await addTestPenalty(db, inA[1], officer.id, "2026-09-01");

      expect(await readStudentPenalties(db, mentor, inA[0])).toHaveLength(1);
      expect(await readStudentPenalties(db, mentor, inA[1])).toEqual([]);
    });
  });

  it("keeps a Ketua Program Studi who is also Konselor to their own program", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inB, programA } = await setting(db);
      await addTestPenalty(db, inB, officer.id, "2026-09-01");
      const both = await reader(
        db,
        ["head_of_program", "counsellor"],
        programA,
      );

      expect(await readStudentPenalties(db, both, inB)).toEqual([]);
    });
  });

  it.each(NOT_READERS)("reads nothing at all for %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");
      const asking = await reader(db, [role]);

      expect(await readStudentPenalties(db, asking, inA[0])).toBeNull();
    });
  });

  it("reads nothing for a student who asks for their own history", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");
      const own = { ...(await reader(db, ["student"])), studentId: inA[0] };

      expect(await readStudentPenalties(db, own, inA[0])).toBeNull();
    });
  });

  it("gives none for a removed student, and for a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, inA[0]));

      expect(await readStudentPenalties(db, officer, inA[0])).toEqual([]);
      expect(await readStudentPenalties(db, officer, "bukan-id")).toEqual([]);
    });
  });
});

describe("readRecordAddress", () => {
  it.each(["head_of_unit", "discipline_officer"] as const)(
    "gives %s Catat pelanggaran for an active student, opening the form on them",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { inA } = await setting(db);

        expect(
          await readRecordAddress(db, await reader(db, [role]), inA[0]),
        ).toBe(`/pembinaan/disiplin?mahasiswa=${inA[0]}`);
      });
    },
  );

  it("gives no Catat pelanggaran for a student on Cuti or Non aktif", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, inA[0]));
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(eq(students.id, inA[1]));

      expect(await readRecordAddress(db, officer, inA[0])).toBeNull();
      expect(await readRecordAddress(db, officer, inA[1])).toBeNull();
    });
  });

  it.each(["director", "head_of_program", "mentor"] as const)(
    "gives %s, who only reads, no Catat pelanggaran",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { inA, programA } = await setting(db);
        const asking = await reader(db, [role], programA);

        expect(await readRecordAddress(db, asking, inA[0])).toBeNull();
      });
    },
  );
});

describe("readRecordAddress for an account that may not record", () => {
  it("asks the database nothing", async () => {
    const untouched = new Proxy({} as Database, {
      get: () => {
        throw new Error("The database was asked.");
      },
    });
    const director: AccountForAccess = {
      id: "00000000-0000-4000-8000-000000000000",
      roles: ["director"],
      studyProgramId: null,
      studentId: null,
    };

    expect(
      await readRecordAddress(
        untouched,
        director,
        "00000000-0000-4000-8000-000000000001",
      ),
    ).toBeNull();
  });
});

describe("the small detail a name in Daftar pelanggaran opens", () => {
  function open(db: Database, asking: AccountForAccess, id: string) {
    const listed = penalisedReachOf(asking);
    if (listed === null) throw new Error("This account reads no penalties.");
    return readDetailOrBrief(db, asking, id, null, listed);
  }

  it("gives Pembina Disiplin Mahasiswa only the name, NIM, program studi and status of a student with a penalty", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");

      expect(await open(db, officer, inA[0])).toEqual({
        kind: "brief",
        student: {
          id: inA[0],
          name: "Mahasiswa Uji Riwayat A 1",
          nim: "9944400001",
          studyProgram: "Prodi Uji Riwayat A",
          status: "active",
        },
      });
    });
  });

  it("finds no student without a penalty for Pembina Disiplin Mahasiswa", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);

      expect(await open(db, officer, inA[1])).toEqual({ kind: "not_found" });
    });
  });

  it("gives Kepala Unit the whole detail", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestPenalty(db, inA[0], officer.id, "2026-09-01");

      const answer = await open(db, await reader(db, ["head_of_unit"]), inA[0]);

      expect(answer.kind).toBe("found");
    });
  });

  it("finds no student of another program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inB, programA } = await setting(db);
      await addTestPenalty(db, inB, officer.id, "2026-09-01");
      const head = await reader(db, ["head_of_program"], programA);

      expect(await open(db, head, inB)).toEqual({ kind: "not_found" });
    });
  });

  it("sends Pembina Disiplin Mahasiswa no other panel of the detail, as they hold none of its rights", () => {
    const otherPanels = [
      "view_student_detail",
      "view_student_character_panels",
      "view_student_fitness_panel",
      "view_student_fitness_notes",
      "view_siku",
      "view_mentoring_notes",
      "record_mental_health_screenings",
      "view_shared_counselling_data",
    ] as const;
    for (const action of otherPanels) {
      expect(may(["discipline_officer"], action), action).toBe(false);
    }
  });

  it("lists nobody for an account that may not read discipline records", () => {
    const counsellor: AccountForAccess = {
      id: "00000000-0000-4000-8000-000000000000",
      roles: ["counsellor"],
      studyProgramId: null,
      studentId: null,
    };

    expect(penalisedReachOf(counsellor)).toBeNull();
  });
});
