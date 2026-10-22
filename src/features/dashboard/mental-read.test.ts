// Sample NIMs of this file: 9986540000 to 9986540099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  counsellingSessions,
  counsellingSharingReads,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnSharing } from "@/features/counselling/press-sharing";
import { changeSharingAsCounsellor } from "@/features/counselling/publish-sharing";
import {
  addTestActor,
  type TestPeople,
} from "@/features/counselling/test-consents";
import { addTestScreening } from "@/features/counselling/test-screenings";
import {
  addConsentedPeople,
  CONSENTED_AT,
} from "@/features/counselling/test-sessions";
import {
  PUBLISHED_AT,
  publishTestSharing,
  TEST_SUMMARY,
  type TestShare,
} from "@/features/counselling/test-shared";
import { type DashboardFilters, NO_FILTERS } from "./dashboard-address";
import { dashboardScopeOf } from "./dashboard-scope";
import { loadDashboard } from "./dashboard-view";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Mental Dashboard";
const TODAY = "2026-10-21";

const NIMS = Array.from(
  { length: 7 },
  (_, place) => `99865400${String(place + 1).padStart(2, "0")}`,
);

function studentOf(people: TestPeople, place: number) {
  const studentId = people.studentIds[place];
  if (studentId === undefined) throw new Error("No such student.");
  return { ...people, studentId };
}

async function addSession(
  db: Database,
  people: TestPeople,
  place: number,
): Promise<void> {
  const { studentId, counsellor } = studentOf(people, place);
  await db.insert(counsellingSessions).values({
    studentId,
    day: "2026-10-19",
    kind: "individual_in_person",
    topic: "academic",
    notes: "Catatan uji sesi rahasia.",
    followUp: "monitoring",
    writtenBy: counsellor.id,
    writtenAt: CONSENTED_AT,
    changedBy: counsellor.id,
    changedAt: CONSENTED_AT,
  });
}

/**
 * Seven students of one program: 1 to 3 from Bali, 4 to 6 from Jawa
 * Barat, 7 from Papua. 1 to 6 are screened, 6 is on Cuti so never counts,
 * 7 is not screened. Published: 1 with the level Sedang to Kepala Unit
 * and Ketua Program Studi; 2, Berat, with counselling and summary to
 * Kepala Unit; 3 to Pengasuh only; 6, on Cuti, to Kepala Unit.
 */
async function addRecords(db: Database) {
  const people = await addConsentedPeople(db, PROGRAM, NIMS);
  const levels = ["moderate", "severe", "mild", "normal", "normal", "severe"];
  for (const [place, level] of levels.entries()) {
    const { studentId, counsellor } = studentOf(people, place);
    await addTestScreening(db, studentId, counsellor.id, {
      level: level as "normal",
    });
  }
  for (const [place, province] of [
    "Bali",
    "Bali",
    "Bali",
    "Jawa Barat",
    "Jawa Barat",
    "Jawa Barat",
    "Papua",
  ].entries()) {
    await db
      .update(students)
      .set({ province })
      .where(eq(students.id, studentOf(people, place).studentId));
  }
  await db
    .update(students)
    .set({ status: "on_leave" })
    .where(eq(students.id, studentOf(people, 5).studentId));
  const share = async (place: number, how: TestShare) => {
    if (!how.data.includes("level") || how.data.length > 1) {
      await addSession(db, people, place);
    }
    return publishTestSharing(db, studentOf(people, place), how);
  };
  const first = await share(0, {
    data: ["level"],
    recipients: ["head_of_unit", "head_of_program"],
  });
  const second = await share(1, {
    data: ["counselling", "summary"],
    recipients: ["head_of_unit"],
  });
  await share(2, { data: ["level"], recipients: ["mentor"] });
  await share(5, { data: ["level"], recipients: ["head_of_unit"] });
  const [programId] = await db
    .select({ id: students.studyProgramId })
    .from(students)
    .where(eq(students.id, studentOf(people, 0).studentId));
  if (!programId) throw new Error("No program.");
  return { people, programId: programId.id, sharings: [first, second] };
}

function readingsBy(db: Database, readBy: string) {
  return db
    .select({
      sharingId: counsellingSharingReads.sharingId,
      studentId: counsellingSharingReads.studentId,
    })
    .from(counsellingSharingReads)
    .where(eq(counsellingSharingReads.readBy, readBy));
}

async function readerOf(
  db: Database,
  roles: RoleId[],
  programId: number,
): Promise<AccountForAccess> {
  const actor = await addTestActor(db, "Pembaca Uji Dashboard", roles);
  return { ...actor, studyProgramId: programId };
}

/** Every number the value holds, however deep. */
function numbersIn(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numbersIn);
}

async function mentalOf(
  db: Database,
  reader: AccountForAccess,
  asked: Partial<DashboardFilters> = {},
) {
  const scope = dashboardScopeOf(reader);
  if (scope === null) throw new Error("The reader was refused.");
  const view = await loadDashboard(
    db,
    scope,
    { ...NO_FILTERS, ...asked },
    null,
    TODAY,
  );
  return view.mental;
}

describe("Kesehatan mental of Dashboard pembangunan karakter", () => {
  it("counts the Aktif students with a screening, and the data published to Kepala Unit with those needing counselling", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const head = await readerOf(db, ["head_of_unit"], programId);

      const mental = await mentalOf(db, head, { studyProgramId: programId });

      expect(mental.recap).toEqual({
        kind: "shown",
        assessed: 5,
        byLevel: {
          normal: "<5",
          mild: "<5",
          moderate: "<5",
          severe: "<5",
          extremely_severe: 0,
        },
      });
      expect(mental.published).toMatchObject({
        matching: 2,
        needCounselling: 1,
      });
    });
  });

  it("counts each Aktif student once, at the level of their latest screening, and sends no count of 1 to 4", async () => {
    await inTestDatabase(async (db) => {
      const { people, programId } = await addRecords(db);
      for (const place of [0, 1, 2]) {
        const { studentId, counsellor } = studentOf(people, place);
        await addTestScreening(db, studentId, counsellor.id, {
          screenedOn: "2026-10-20",
          level: "normal",
        });
      }
      const head = await readerOf(db, ["head_of_unit"], programId);

      const mental = await mentalOf(db, head, { studyProgramId: programId });

      expect(mental.recap).toMatchObject({
        kind: "shown",
        assessed: 5,
        byLevel: { normal: 5, mild: 0, moderate: 0, severe: 0 },
      });
      const small = numbersIn(mental.recap).filter(
        (each) => each >= 1 && each <= 4,
      );
      expect(small).toEqual([]);
    });
  });

  it("gives no count for a filtered group with 1 to 4 assessed, and tells none apart", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const head = await readerOf(db, ["head_of_unit"], programId);
      const inProgram = { studyProgramId: programId };

      const bali = await mentalOf(db, head, { ...inProgram, province: "Bali" });
      const papua = await mentalOf(db, head, {
        ...inProgram,
        province: "Papua",
      });

      expect(bali.recap).toEqual({ kind: "too_few" });
      expect(bali.published).toMatchObject({ matching: 2 });
      expect(papua.recap).toEqual({ kind: "none" });
      expect(papua.published).toMatchObject({
        matching: 0,
        needCounselling: 0,
      });
    });
  });

  it("gives Ketua Program Studi their own program, and only what is published to their role", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const own = await readerOf(db, ["head_of_program"], programId);
      const other = await readerOf(db, ["head_of_program"], programId + 1000);

      const mine = await mentalOf(db, own);
      const theirs = await mentalOf(db, other);

      expect(mine.recap).toMatchObject({ kind: "shown", assessed: 5 });
      expect(mine.published).toMatchObject({
        matching: 1,
        needCounselling: 1,
      });
      expect(theirs.recap).toEqual({ kind: "none" });
      expect(theirs.published).toMatchObject({ matching: 0 });
    });
  });

  it("gives Direktur nothing published to other roles", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const director = await readerOf(db, ["director"], programId);

      const mental = await mentalOf(db, director, {
        studyProgramId: programId,
      });

      expect(mental.published).toMatchObject({
        matching: 0,
        needCounselling: 0,
      });
    });
  });
});

describe("Data kesehatan mental yang dipublikasikan on the Dashboard", () => {
  it("lists only the parts each student agreed to share, the newest first, never the session notes", async () => {
    await inTestDatabase(async (db) => {
      const { people, programId } = await addRecords(db);
      const head = await readerOf(db, ["head_of_unit"], programId);

      const mental = await mentalOf(db, head, { studyProgramId: programId });

      expect(mental.published?.rows).toEqual([
        {
          studentId: studentOf(people, 0).studentId,
          publishedAt: PUBLISHED_AT,
          name: "Mahasiswa Uji Konseling 1",
          mentorName: null,
          data: ["level"],
          level: "moderate",
          sessions: null,
          summary: null,
        },
        {
          studentId: studentOf(people, 1).studentId,
          publishedAt: PUBLISHED_AT,
          name: "Mahasiswa Uji Konseling 2",
          mentorName: null,
          data: ["counselling", "summary"],
          level: null,
          sessions: {
            count: 1,
            lastDay: "2026-10-19",
            followUp: "monitoring",
            nextDay: null,
          },
          summary: TEST_SUMMARY,
        },
      ]);
      expect(JSON.stringify(mental)).not.toContain("Catatan uji sesi rahasia");
      expect(JSON.stringify(mental.published)).not.toContain("severe");
    });
  });

  it("logs each row shown: who, whose data and which sharing", async () => {
    await inTestDatabase(async (db) => {
      const { people, programId, sharings } = await addRecords(db);
      const head = await readerOf(db, ["head_of_unit"], programId);

      await mentalOf(db, head, { studyProgramId: programId });

      const logged = await readingsBy(db, head.id);
      expect(logged).toHaveLength(2);
      expect(logged).toEqual(
        expect.arrayContaining(
          [0, 1].map((place) => ({
            sharingId: sharings[place]?.id,
            studentId: studentOf(people, place).studentId,
          })),
        ),
      );
    });
  });

  it("drops a student on the next load once the student or the counsellor withdraws the sharing", async () => {
    await inTestDatabase(async (db) => {
      const { people, programId, sharings } = await addRecords(db);
      const [first, second] = sharings;
      const student = people.students[0];
      if (!first || !second || !student) throw new Error("Missing records.");
      const head = await readerOf(db, ["head_of_unit"], programId);
      const inProgram = { studyProgramId: programId };

      await changeOwnSharing(db, student, "withdraw", first.id, first.version);
      const afterStudent = await mentalOf(db, head, inProgram);
      await changeSharingAsCounsellor(
        db,
        people.counsellor,
        studentOf(people, 1).studentId,
        "cancel",
        second.id,
        second.version,
      );
      const afterCounsellor = await mentalOf(db, head, inProgram);

      expect(afterStudent.published).toMatchObject({
        matching: 1,
        needCounselling: 0,
        rows: [{ name: "Mahasiswa Uji Konseling 2" }],
      });
      expect(afterCounsellor.published).toEqual({
        rows: [],
        matching: 0,
        needCounselling: 0,
      });
      expect(await readingsBy(db, head.id)).toHaveLength(1);
    });
  });

  it("shows the newest 8 of more, with every one counted", async () => {
    await inTestDatabase(async (db) => {
      const nims = Array.from(
        { length: 10 },
        (_, place) => `99865400${String(place + 20)}`,
      );
      const people = await addConsentedPeople(db, `${PROGRAM} Banyak`, nims);
      for (const place of nims.keys()) {
        const { studentId, counsellor } = studentOf(people, place);
        await addTestScreening(db, studentId, counsellor.id);
        await publishTestSharing(db, studentOf(people, place), {
          data: ["level"],
          recipients: ["director"],
        });
      }
      const [found] = await db
        .select({ id: students.studyProgramId })
        .from(students)
        .where(eq(students.id, studentOf(people, 0).studentId));
      if (!found) throw new Error("No program.");
      const director = await readerOf(db, ["director"], found.id);

      const mental = await mentalOf(db, director, { studyProgramId: found.id });

      expect(mental.published?.matching).toBe(10);
      expect(mental.published?.rows).toHaveLength(8);
      expect(await readingsBy(db, director.id)).toHaveLength(8);
    });
  });

  it("is refused to Pengasuh, Konselor, Penilai Mahasiswa and every role without the Dashboard, so nothing is read or logged", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const refused: RoleId[][] = [
        ["mentor"],
        ["counsellor"],
        ["assessor"],
        ["student"],
        ["dorm_manager"],
      ];
      for (const roles of refused) {
        const reader = await readerOf(db, roles, programId);

        expect(dashboardScopeOf(reader)).toBeNull();
        expect(await readingsBy(db, reader.id)).toHaveLength(0);
      }
    });
  });

  it("reads nothing published and logs nothing for a scope without a reader", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const head = await readerOf(db, ["head_of_unit"], programId);
      const scope = dashboardScopeOf(head);
      if (scope === null) throw new Error("Kepala Unit was refused.");

      const view = await loadDashboard(
        db,
        { ...scope, shared: null },
        { ...NO_FILTERS, studyProgramId: programId },
        null,
        TODAY,
      );

      expect(view.mental.published).toBeNull();
      expect(await readingsBy(db, head.id)).toHaveLength(0);
    });
  });
});
