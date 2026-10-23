// Sample Tahun akademik of this file: 3913 to 3913.
// Sample NIMs of this file: 9913000000 to 9913000099.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  counsellingSessions,
  counsellingSharingReads,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestRoom, placeTestResident } from "@/dorms/test-records";
import { changeOwnSharing } from "@/features/counselling/press-sharing";
import { changeSharingAsCounsellor } from "@/features/counselling/publish-sharing";
import {
  addTestActor,
  type TestPeople,
} from "@/features/counselling/test-consents";
import { addTestScreening } from "@/features/counselling/test-screenings";
import { addConsentedPeople } from "@/features/counselling/test-sessions";
import {
  addTestMentorOf,
  PUBLISHED_AT,
  publishTestSharing,
  TEST_SUMMARY,
  type TestShare,
} from "@/features/counselling/test-shared";
import type { ScreeningLevel } from "@/mental-health/screening-ids";
import { loadDormHealth } from "./dashboard-health";

const inTestDatabase = withTestDatabase();

/* Angkatan 3913 is in semester 1 in this period, so it lives in the dorm. */
const ODD_3913 = {
  startYear: 3913,
  term: "odd",
  startsOn: "3913-08-01",
  endsOn: "3914-01-31",
} as const;
// 10:00 on campus on 12 October 3913.
const MOMENT = new Date("3913-10-12T03:00:00Z");

function nimsFrom(first: number, length: number): string[] {
  return Array.from(
    { length },
    (_, place) => `99130000${String(first + place).padStart(2, "0")}`,
  );
}

async function addSession(
  db: Database,
  studentId: string,
  by: string,
  day: string,
): Promise<void> {
  const at = new Date(`${day}T03:00:00Z`);
  await db.insert(counsellingSessions).values({
    studentId,
    day,
    kind: "individual_in_person",
    topic: "academic",
    notes: "Catatan uji sesi rahasia asrama.",
    followUp: "monitoring",
    writtenBy: by,
    writtenAt: at,
    changedBy: by,
    changedAt: at,
  });
}

async function programOf(db: Database, studentId: string): Promise<number> {
  const [found] = await db
    .select({ id: students.studyProgramId })
    .from(students)
    .where(eq(students.id, studentId));
  if (!found) throw new Error("No program.");
  return found.id;
}

/** Students of one program, all of angkatan 3913, each screened at the level given, or not with null. */
async function addProgram(
  db: Database,
  name: string,
  firstNim: number,
  levels: (ScreeningLevel | null)[],
) {
  const people = await addConsentedPeople(
    db,
    name,
    nimsFrom(firstNim, levels.length),
  );
  await db
    .update(students)
    .set({ cohortYear: 3913 })
    .where(inArray(students.id, people.studentIds));
  for (const [place, level] of levels.entries()) {
    const studentId = people.studentIds[place];
    if (level === null || studentId === undefined) continue;
    await addTestScreening(db, studentId, people.counsellor.id, { level });
  }
  return people;
}

function idOf(ids: string[], place: number): string {
  const id = ids[place];
  if (id === undefined) throw new Error("No such student.");
  return id;
}

/**
 * Angkatan 3913 is in semester 1, so its Reguler women live in Dana Rakca.
 * - Prodi A: 1 to 5 Normal, 6 Ringan, 7 Berat, 8 not screened, 9 Berat
 *   but of angkatan 3909, so in no dorm, 10 Berat but on Cuti; sessions
 *   of 1 to 5 in the last 30 days, of 6 before, and of 9 and 10;
 * - Prodi B: 1 to 3 Normal, with a session of 1 in the last 30 days.
 */
async function addRecords(db: Database) {
  await db.insert(academicPeriods).values(ODD_3913);
  const a = await addProgram(db, "Prodi Uji Mental Asrama A", 1, [
    "normal",
    "normal",
    "normal",
    "normal",
    "normal",
    "mild",
    "severe",
    null,
    "severe",
    "severe",
  ]);
  const b = await addProgram(db, "Prodi Uji Mental Asrama B", 20, [
    "normal",
    "normal",
    "normal",
  ]);
  await db
    .update(students)
    .set({ cohortYear: 3909 })
    .where(eq(students.id, idOf(a.studentIds, 8)));
  await db
    .update(students)
    .set({ status: "on_leave" })
    .where(eq(students.id, idOf(a.studentIds, 9)));
  const by = a.counsellor.id;
  for (const place of [0, 1, 2, 3, 4, 8, 9]) {
    await addSession(db, idOf(a.studentIds, place), by, "3913-10-01");
  }
  await addSession(db, idOf(a.studentIds, 5), by, "3913-09-01");
  await addSession(db, idOf(b.studentIds, 0), b.counsellor.id, "3913-10-11");
  return {
    a,
    b,
    programA: await programOf(db, idOf(a.studentIds, 0)),
    programB: await programOf(db, idOf(b.studentIds, 0)),
  };
}

async function readerOf(
  db: Database,
  roles: RoleId[],
  programId: number | null = null,
): Promise<AccountForAccess> {
  const actor = await addTestActor(db, "Pembaca Uji Asrama", roles);
  return { ...actor, studyProgramId: programId };
}

/** Every number the value holds, however deep. */
function numbersIn(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numbersIn);
}

describe("loadDormHealth: Kesehatan mental penghuni", () => {
  it.each(["head_of_unit", "director"] as const)(
    "gives %s every Aktif resident's latest level, each of 1 to 4 as <5 and Normal as 5+ beside two <5 of 1, and the sessions of the last 30 days",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addRecords(db);
        const reader = await readerOf(db, [role]);

        const { mental } = await loadDormHealth(db, reader, MOMENT);

        expect(mental).toMatchObject({
          recap: {
            kind: "shown",
            assessed: 10,
            byLevel: {
              normal: "5+",
              mild: "<5",
              moderate: 0,
              severe: "<5",
              extremely_severe: 0,
            },
          },
          sessions: 6,
        });
      });
    },
  );

  it("counts only Ketua Program Studi's own program, with the rule of 5 on that group", async () => {
    await inTestDatabase(async (db) => {
      const { programA, programB } = await addRecords(db);
      const headA = await readerOf(db, ["head_of_program"], programA);
      const headB = await readerOf(db, ["head_of_program"], programB);

      const ofA = await loadDormHealth(db, headA, MOMENT);
      const ofB = await loadDormHealth(db, headB, MOMENT);

      expect(ofA.mental).toMatchObject({
        recap: { kind: "shown", assessed: 7, byLevel: { normal: "5+" } },
        sessions: 5,
      });
      expect(ofB.mental).toMatchObject({
        recap: { kind: "too_few" },
        sessions: null,
      });
      expect(numbersIn(ofB.mental)).toEqual([]);
    });
  });

  it("says nobody is assessed, with no session count, when no resident in reach is", async () => {
    await inTestDatabase(async (db) => {
      const { programA } = await addRecords(db);
      const other = await readerOf(db, ["head_of_program"], programA + 1000);

      const { mental } = await loadDormHealth(db, other, MOMENT);

      expect(mental).toMatchObject({
        recap: { kind: "none" },
        sessions: null,
      });
    });
  });

  it.each([
    "dorm_manager",
    "bam_health",
    "bam_bphk",
    "bam_compliance",
    "bam_household",
    "mentor",
    "counsellor",
    "student",
  ] as const)(
    "reads nothing of the residents' mental health for %s, asked by hand",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addRecords(db);
        const reader = await readerOf(db, [role]);

        const { mental } = await loadDormHealth(db, reader, MOMENT);

        expect(mental).toBeNull();
      });
    },
  );
});

function readingsBy(db: Database, readBy: string) {
  return db
    .select({
      sharingId: counsellingSharingReads.sharingId,
      studentId: counsellingSharingReads.studentId,
    })
    .from(counsellingSharingReads)
    .where(eq(counsellingSharingReads.readBy, readBy));
}

function sharingStudent(people: TestPeople, place: number) {
  return { ...people, studentId: idOf(people.studentIds, place) };
}

/**
 * On top of addRecords' residents, Prodi A's 1 is placed in room DM-01
 * of Dana Rakca. Published: 1 with the level to Kepala Unit and Ketua
 * Program Studi; 2 with the sessions and the summary to Kepala Unit; 3
 * with the level to Pengasuh only; 9, who lives in no dorm, with the
 * level to Kepala Unit.
 */
async function addSharedRecords(db: Database) {
  const records = await addRecords(db);
  const { a } = records;
  const room = await addTestRoom(db, { number: "DM-01" });
  await placeTestResident(db, room, idOf(a.studentIds, 0));
  const share = (place: number, how: TestShare) =>
    publishTestSharing(db, sharingStudent(a, place), how);
  const first = await share(0, {
    data: ["level"],
    recipients: ["head_of_unit", "head_of_program"],
  });
  const second = await share(1, {
    data: ["counselling", "summary"],
    recipients: ["head_of_unit"],
  });
  await share(2, { data: ["level"], recipients: ["mentor"] });
  await share(8, { data: ["level"], recipients: ["head_of_unit"] });
  return { ...records, sharings: [first, second] as const };
}

describe("loadDormHealth: Data yang dipublikasikan konselor untuk Anda", () => {
  it("gives Kepala Unit each resident whose data is published to the role, with the room and only what was shared, and logs each row", async () => {
    await inTestDatabase(async (db) => {
      const { a, sharings } = await addSharedRecords(db);
      const head = await readerOf(db, ["head_of_unit"]);

      const { mental } = await loadDormHealth(db, head, MOMENT);

      expect(mental?.published).toEqual([
        {
          studentId: idOf(a.studentIds, 0),
          publishedAt: PUBLISHED_AT,
          name: "Mahasiswa Uji Konseling 1",
          mentorName: null,
          room: "Dana Rakca, lantai 1, kamar DM-01",
          data: ["level"],
          level: "normal",
          sessions: null,
          summary: null,
        },
        {
          studentId: idOf(a.studentIds, 1),
          publishedAt: PUBLISHED_AT,
          name: "Mahasiswa Uji Konseling 2",
          mentorName: null,
          room: "Dana Rakca, belum diplot",
          data: ["counselling", "summary"],
          level: null,
          sessions: {
            count: 1,
            lastDay: "3913-10-01",
            followUp: "monitoring",
            nextDay: null,
          },
          summary: TEST_SUMMARY,
        },
      ]);
      expect(JSON.stringify(mental)).not.toContain("rahasia");
      expect(await readingsBy(db, head.id)).toEqual(
        expect.arrayContaining(
          [0, 1].map((place) => ({
            sharingId: sharings[place]?.id,
            studentId: idOf(a.studentIds, place),
          })),
        ),
      );
      expect(await readingsBy(db, head.id)).toHaveLength(2);
    });
  });

  it("gives each role only what is published to it: Ketua Program Studi their own program, Direktur nothing here", async () => {
    await inTestDatabase(async (db) => {
      const { programA, programB } = await addSharedRecords(db);
      const headA = await readerOf(db, ["head_of_program"], programA);
      const headB = await readerOf(db, ["head_of_program"], programB);
      const director = await readerOf(db, ["director"]);

      const ofA = await loadDormHealth(db, headA, MOMENT);
      const ofB = await loadDormHealth(db, headB, MOMENT);
      const ofDirector = await loadDormHealth(db, director, MOMENT);

      expect(ofA.mental?.published?.map((row) => row.name)).toEqual([
        "Mahasiswa Uji Konseling 1",
      ]);
      expect(ofB.mental?.published).toEqual([]);
      expect(ofDirector.mental?.published).toEqual([]);
      expect(await readingsBy(db, director.id)).toEqual([]);
    });
  });

  it("gives a Ketua Program Studi who is also Pengasuh nothing published to Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { a, programA } = await addSharedRecords(db);
      const { mentor } = await addTestMentorOf(db, idOf(a.studentIds, 2));
      const both = {
        ...mentor,
        roles: ["mentor", "head_of_program"] as RoleId[],
        studyProgramId: programA,
      };

      const { mental } = await loadDormHealth(db, both, MOMENT);

      expect(mental?.published?.map((row) => row.name)).toEqual([
        "Mahasiswa Uji Konseling 1",
      ]);
    });
  });

  it("drops a resident the next time it is opened once the student withdraws or the counsellor stops sharing", async () => {
    await inTestDatabase(async (db) => {
      const { a, sharings } = await addSharedRecords(db);
      const [first, second] = sharings;
      const student = a.students[0];
      if (student === undefined) throw new Error("No student account.");
      const head = await readerOf(db, ["head_of_unit"]);

      await changeOwnSharing(db, student, "withdraw", first.id, first.version);
      const afterStudent = await loadDormHealth(db, head, MOMENT);
      await changeSharingAsCounsellor(
        db,
        a.counsellor,
        idOf(a.studentIds, 1),
        "cancel",
        second.id,
        second.version,
      );
      const afterCounsellor = await loadDormHealth(db, head, MOMENT);

      expect(afterStudent.mental?.published?.map((row) => row.name)).toEqual([
        "Mahasiswa Uji Konseling 2",
      ]);
      expect(afterCounsellor.mental?.published).toEqual([]);
    });
  });
});
