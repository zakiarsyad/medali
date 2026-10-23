// Sample Tahun akademik of this file: 3911 to 3911.
// Sample NIMs of this file: 9911000000 to 9911000099.

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { addTestNote } from "@/health-notes/test-health";
import { loadDormHealth } from "./dashboard-health";
import {
  addHealthActor,
  addHealthGroup,
  addHealthScores,
  type HealthActor,
} from "./test-health";

const inTestDatabase = withTestDatabase();

/* Angkatan 3911 is in semester 1 in this period, so it lives in the dorm. */
const ODD_3911 = {
  startYear: 3911,
  term: "odd",
  startsOn: "3911-08-01",
  endsOn: "3912-01-31",
} as const;
// 10:00 on campus on 12 October 3911.
const MOMENT = new Date("3911-10-12T03:00:00Z");

let nimCount = 0;

function nextNim(): string {
  nimCount += 1;
  return `99110000${String(nimCount % 100).padStart(2, "0")}`;
}

interface Resident {
  program: number;
  sex?: "female" | "male" | undefined;
  score?: number | undefined;
  more?: Partial<typeof students.$inferInsert>;
}

async function addResident(db: Database, resident: Resident) {
  const nim = nextNim();
  return addTestStudent(db, resident.program, {
    nim,
    name: `Penghuni Uji Kesehatan ${nim.slice(-2)}`,
    sex: resident.sex ?? "female",
    cohortYear: 3911,
    ...resident.more,
  });
}

/**
 * Angkatan 3911 is in semester 1, so its Reguler students live in Dana
 * Rakca (women) and Cipta Bakti (men).
 * - Prodi A: six women tested at 90, 90, 75, 75, 60 and 40, two men
 *   tested at 90, and one woman not tested;
 * - Prodi B: three women tested at 90, one on Cuti tested at 40, and one
 *   of angkatan 3909 tested at 40, who lives in no dorm.
 */
async function addRecords(db: Database) {
  nimCount = 0;
  await db.insert(academicPeriods).values(ODD_3911);
  const programA = await addTestProgram(db, "Prodi Uji Kesehatan Dash A");
  const programB = await addTestProgram(db, "Prodi Uji Kesehatan Dash B");
  const kepala = await actorWith(db, ["head_of_unit"]);
  const tested = async (program: number, residents: Resident[]) => {
    const ids: string[] = [];
    for (const resident of residents) ids.push(await addResident(db, resident));
    const group = await addHealthGroup(db, program, ids);
    const scores = residents.flatMap((resident, place) => {
      const studentId = ids[place];
      if (resident.score === undefined || studentId === undefined) return [];
      return [{ studentId, score: resident.score }];
    });
    await addHealthScores(db, kepala, group, scores);
    return ids;
  };
  const a = (score?: number, sex?: "male") => ({
    program: programA,
    sex,
    score,
  });
  const idsA = await tested(programA, [
    a(90),
    a(90),
    a(75),
    a(75),
    a(60),
    a(40),
    a(90, "male"),
    a(90, "male"),
    a(),
  ]);
  const b = (score: number, more = {}) => ({
    program: programB,
    score,
    more,
  });
  const idsB = await tested(programB, [
    b(90),
    b(90),
    b(90),
    b(40, { status: "on_leave" }),
    b(40, { cohortYear: 3909 }),
  ]);
  return { programA, programB, kepala, idsA, idsB };
}

async function actorWith(
  db: Database,
  roles: RoleId[],
  programId: number | null = null,
): Promise<HealthActor> {
  return addHealthActor(db, `Akun Uji ${roles.join(" ")}`, roles, programId);
}

describe("loadDormHealth: Kesehatan jasmani penghuni", () => {
  it.each([
    "head_of_unit",
    "director",
    "dorm_manager",
    "bam_health",
    "bam_bphk",
  ] as const)(
    "gives %s every Aktif resident's category, in the bars and per dorm, each of 1 to 4 as <5",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addRecords(db);
        const actor = await actorWith(db, [role]);

        const { physical } = await loadDormHealth(db, actor, MOMENT);

        expect(physical?.recap).toEqual({
          kind: "shown",
          students: 12,
          tested: 11,
          untested: "<5",
          byCategory: {
            excellent: 7,
            good: "<5",
            attention: "<5",
            medical: "<5",
          },
          fitShare: 82,
          illnesses: null,
        });
        expect(physical?.byDorm).toEqual({
          wismantara_putra: { excellent: 0, good: 0, attention: 0, medical: 0 },
          wismantara_putri: { excellent: 0, good: 0, attention: 0, medical: 0 },
          dana_rakca: {
            excellent: 5,
            good: "<5",
            attention: "<5",
            medical: "<5",
          },
          cipta_bakti: { excellent: "<5", good: 0, attention: 0, medical: 0 },
        });
      });
    },
  );

  it("counts only Ketua Program Studi's own program, with the rule of 5 on that group", async () => {
    await inTestDatabase(async (db) => {
      const { programA, programB } = await addRecords(db);
      const headA = await actorWith(db, ["head_of_program"], programA);
      const headB = await actorWith(db, ["head_of_program"], programB);

      const ofA = await loadDormHealth(db, headA, MOMENT);
      const ofB = await loadDormHealth(db, headB, MOMENT);

      expect(ofA.physical?.recap).toMatchObject({
        kind: "shown",
        students: 9,
        tested: 8,
      });
      expect(ofA.physical?.byDorm?.dana_rakca.excellent).toBe("<5");
      expect(ofB.physical).toEqual({
        recap: { kind: "too_few", students: 3 },
        byDorm: null,
        limits: expect.any(Object),
        care: null,
      });
    });
  });

  it.each([
    "bam_compliance",
    "bam_household",
    "bam_spiritual",
    "bam_catering",
    "bam_arts_sports",
    "mentor",
    "counsellor",
    "student",
  ] as const)(
    "reads nothing of the residents' physical health for %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addRecords(db);
        const actor = await actorWith(db, [role]);

        const { physical } = await loadDormHealth(db, actor, MOMENT);

        expect(physical).toBeNull();
      });
    },
  );
});

/**
 * On top of addRecords' residents:
 * - Prodi A's woman tested at 40, Perlu tindak lanjut medis with no
 *   note, is placed in room DH-01 of Dana Rakca;
 * - Prodi A's first woman tested at 75 has a note "Perlu perhatian";
 * - Prodi B's first woman tested at 90 has a note "Perlu tindak lanjut
 *   medis";
 * - Prodi A's woman tested at 60, Perlu perhatian by the test alone with
 *   no note, is not in the list of Kesehatan, so not here either;
 * - Prodi B's woman on Cuti, and the one of angkatan 3909, both tested
 *   at 40, are no Aktif residents.
 */
async function addCareRecords(db: Database) {
  const records = await addRecords(db);
  const { kepala, idsA, idsB } = records;
  const [, , goodA, , attentionA, medicalA] = idsA;
  const [firstB] = idsB;
  if (!goodA || !attentionA || !medicalA || !firstB) {
    throw new Error("The residents were not added.");
  }
  const room = await addTestRoom(db, { number: "DH-01" });
  await placeTestResident(db, room, medicalA);
  const savedAt = new Date("3911-10-01T03:00:00Z");
  await addTestNote(db, kepala, {
    studentId: goodA,
    savedAt,
    illnesses: [{ illness: "asthma", note: "" }],
    advice: "Kontrol rutin.",
    category: "attention",
  });
  await addTestNote(db, kepala, {
    studentId: firstB,
    savedAt,
    advice: "Rujuk ke RS.",
    category: "medical",
  });
  return records;
}

describe("loadDormHealth: Perlu perhatian dan tindak lanjut medis", () => {
  it.each(["dorm_manager", "head_of_unit", "bam_health", "bam_bphk"] as const)(
    "gives %s the residents of the list of Kesehatan in the two lower categories, heaviest first, with the room and the last note",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addCareRecords(db);
        const actor = await actorWith(db, [role]);

        const { physical } = await loadDormHealth(db, actor, MOMENT);

        expect(physical?.care?.map(({ id: _, ...row }) => row)).toEqual([
          {
            name: "Penghuni Uji Kesehatan 06",
            room: "Dana Rakca, lantai 1, kamar DH-01",
            final: { category: "medical", fromNote: false },
            note: null,
          },
          {
            name: "Penghuni Uji Kesehatan 10",
            room: "Dana Rakca, belum diplot",
            final: { category: "medical", fromNote: true },
            note: "Rujuk ke RS.",
          },
          {
            name: "Penghuni Uji Kesehatan 03",
            room: "Dana Rakca, belum diplot",
            final: { category: "attention", fromNote: true },
            note: "Riwayat: Asma. Kontrol rutin.",
          },
        ]);
      });
    },
  );

  it("gives at most 8 residents, the heaviest", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, idsA, idsB } = await addRecords(db);
      const savedAt = new Date("3911-10-01T03:00:00Z");
      for (const studentId of [...idsA, ...idsB]) {
        await addTestNote(db, kepala, {
          studentId,
          savedAt,
          category: "attention",
        });
      }
      const actor = await actorWith(db, ["bam_health"]);

      const { physical } = await loadDormHealth(db, actor, MOMENT);

      expect(physical?.care).toHaveLength(8);
      expect(physical?.care?.[0]).toMatchObject({
        name: "Penghuni Uji Kesehatan 06",
        final: { category: "medical" },
      });
    });
  });

  it("gives an empty list when no resident in reach needs care", async () => {
    await inTestDatabase(async (db) => {
      const { idsA } = await addRecords(db);
      const medicalA = idsA[5];
      if (medicalA === undefined) throw new Error("No resident was added.");
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, medicalA));
      const actor = await actorWith(db, ["dorm_manager"]);

      const { physical } = await loadDormHealth(db, actor, MOMENT);

      expect(physical?.recap.kind).toBe("shown");
      expect(physical?.care).toEqual([]);
    });
  });

  it.each([
    ["director", null],
    ["head_of_program", "A"],
  ] as const)(
    "gives %s the counts and no name or note",
    async (role, program) => {
      await inTestDatabase(async (db) => {
        const { programA } = await addCareRecords(db);
        const actor = await actorWith(
          db,
          [role],
          program === null ? null : programA,
        );

        const { physical } = await loadDormHealth(db, actor, MOMENT);

        expect(physical?.recap.kind).toBe("shown");
        expect(physical?.care).toBeNull();
        expect(JSON.stringify(physical)).not.toContain("Penghuni Uji");
        expect(JSON.stringify(physical)).not.toContain("Rujuk");
      });
    },
  );
});
