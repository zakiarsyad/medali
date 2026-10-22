// Sample NIMs of this file: 9986330000 to 9986330099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  counsellingSessions,
  counsellingSharings,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { SharingStatus } from "@/mental-health/sharing-ids";
import {
  readCounsellingList,
  readCounsellingNumbers,
} from "./counselling-list";
import type { CounsellingListParams } from "./counselling-list-address";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestAssignment, addTestSchedule } from "./test-schedules";
import { setTestConsent } from "./test-screenings";

const inTestDatabase = withTestDatabase();

const ALL: CounsellingListParams = { query: "", filter: "all", page: 1 };

// 10:00 on campus on Rabu 21 October 2026.
const NOW = new Date("2026-10-21T03:00:00Z");

async function addSession(
  db: Database,
  studentId: string,
  by: string,
  day: string,
  nextDay: string | null = null,
) {
  const at = new Date(`${day}T03:00:00Z`);
  await db.insert(counsellingSessions).values({
    studentId,
    day,
    kind: "individual_in_person",
    topic: "academic",
    notes: "Catatan uji daftar.",
    followUp: nextDay === null ? "monitoring" : "next_session",
    nextDay,
    writtenBy: by,
    writtenAt: at,
    changedBy: by,
    changedAt: at,
  });
}

async function addSharing(
  db: Database,
  studentId: string,
  by: string,
  status: SharingStatus,
  askedAt: string,
) {
  const at = new Date(askedAt);
  await db.insert(counsellingSharings).values({
    studentId,
    status,
    data: ["counselling"],
    recipients: ["mentor"],
    way: status === "declined" ? null : "paper",
    askedBy: by,
    askedAt: at,
    publishedBy: status === "published" ? by : null,
    publishedAt: status === "published" ? at : null,
    changedBy: by,
    changedAt: at,
  });
}

/**
 * Students 1 to 6: 1 only asked for consent; 2 with consent, two
 * sessions, the latest setting the next one, and a sharing declined then
 * published; 3 with only an active request; 4 with only a finished one;
 * 5 with an assignment waiting for its time; 6 with nothing.
 */
async function addList(db: Database) {
  const people = await addTestPeople(db, "Prodi Uji Daftar Konseling", [
    "9986330001",
    "9986330002",
    "9986330003",
    "9986330004",
    "9986330005",
    "9986330006",
  ]);
  const by = people.counsellor.id;
  const [one, two, three, four, five, six] = people.studentIds;
  const [, , threeAccount, fourAccount] = people.students;
  if (!one || !two || !three || !four || !five || !six) {
    throw new Error("The students were not added.");
  }
  if (!threeAccount || !fourAccount) throw new Error("No student account.");
  await setTestConsent(db, one, by, "waiting");
  await setTestConsent(db, two, by, "approved");
  await addSession(db, two, by, "2026-09-10");
  await addSession(db, two, by, "2026-10-14", "2026-10-28");
  await addSharing(db, two, by, "declined", "2026-10-01T03:00:00Z");
  await addSharing(db, two, by, "published", "2026-10-15T03:00:00Z");
  await addTestSchedule(db, {
    studentId: three,
    studentAccountId: threeAccount.id,
    status: "scheduled",
    day: "2026-10-26",
    counsellorId: by,
  });
  await addTestSchedule(db, {
    studentId: four,
    studentAccountId: fourAccount.id,
    status: "done",
    day: "2026-10-12",
    counsellorId: by,
  });
  const sender = await addTestActor(db, "Pembina Uji Daftar", [
    "discipline_officer",
  ]);
  await addTestAssignment(db, { studentId: five, senderId: sender.id });
  return { ...people, ids: { one, two, three, four, five, six } };
}

describe("Daftar mahasiswa of Konselor on Konseling", () => {
  it("lists every student with a consent, a schedule or a session, by name, with each column", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);

      const list = await readCounsellingList(db, counsellor, ALL, NOW);

      expect(list?.matching).toBe(5);
      expect(list?.page).toBe(1);
      expect(list?.rows).toEqual([
        {
          studentId: ids.one,
          name: "Mahasiswa Uji Konseling 1",
          nim: "9986330001",
          program: "Prodi Uji Daftar Konseling",
          consent: "waiting",
          sessions: 0,
          nextDay: null,
          schedule: null,
          sharing: null,
        },
        expect.objectContaining({
          studentId: ids.two,
          consent: "approved",
          sessions: 2,
          nextDay: "2026-10-28",
          schedule: null,
          sharing: "published",
        }),
        expect.objectContaining({
          studentId: ids.three,
          consent: null,
          sessions: 0,
          schedule: { status: "scheduled", day: "2026-10-26", hour: "10:00" },
          sharing: null,
        }),
        expect.objectContaining({ studentId: ids.four, schedule: null }),
        expect.objectContaining({
          studentId: ids.five,
          schedule: { status: "awaiting", day: null, hour: null },
        }),
      ]);
    });
  });

  it("leaves out the next session once it has passed", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);
      const later = new Date("2026-10-29T03:00:00Z");

      const list = await readCounsellingList(db, counsellor, ALL, later);
      const two = list?.rows.find((row) => row.studentId === ids.two);

      expect(two?.nextDay).toBeNull();
    });
  });

  it("shows the active schedule that comes soonest, when there is more than one", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);
      const sender = await addTestActor(db, "Penilai Uji Daftar", ["assessor"]);
      await addTestAssignment(db, {
        studentId: ids.three,
        senderId: sender.id,
        kind: "called",
        status: "scheduled",
        day: "2026-10-23",
        counsellorId: counsellor.id,
      });

      const list = await readCounsellingList(db, counsellor, ALL, NOW);
      const three = list?.rows.find((row) => row.studentId === ids.three);

      expect(three?.schedule).toEqual({
        status: "scheduled",
        day: "2026-10-23",
        hour: "10:00",
      });
    });
  });

  it("says nothing exists yet with no student in it", async () => {
    await inTestDatabase(async (db) => {
      const counsellor = await addTestActor(db, "Konselor Uji Kosong", [
        "counsellor",
      ]);

      const list = await readCounsellingList(db, counsellor, ALL, NOW);

      expect(list).toEqual({ rows: [], matching: 0, page: 1 });
    });
  });

  it("shows a change on the next load", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);
      await setTestConsent(db, ids.six, counsellor.id, "waiting");

      const list = await readCounsellingList(db, counsellor, ALL, NOW);

      expect(list?.matching).toBe(6);
      expect(list?.rows.map((row) => row.studentId)).toContain(ids.six);
    });
  });

  it("leaves out a removed student, and the student of the account itself", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);
      await db
        .update(students)
        .set({ deletedAt: NOW })
        .where(eq(students.id, ids.one));
      const alsoStudent: AccountForAccess = {
        ...counsellor,
        studentId: ids.two,
      };

      const list = await readCounsellingList(db, alsoStudent, ALL, NOW);
      const shown = list?.rows.map((row) => row.studentId);

      expect(shown).not.toContain(ids.one);
      expect(shown).not.toContain(ids.two);
      expect(list?.matching).toBe(3);
    });
  });
});

describe("the search and the filter of Daftar mahasiswa", () => {
  async function shownFor(
    db: Database,
    actor: AccountForAccess,
    asked: Partial<CounsellingListParams>,
  ) {
    const list = await readCounsellingList(
      db,
      actor,
      { ...ALL, ...asked },
      NOW,
    );
    return list?.rows.map((row) => row.nim);
  }

  it("finds a student by part of the name or the NIM", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await addList(db);

      expect(await shownFor(db, counsellor, { query: "konseling 3" })).toEqual([
        "9986330003",
      ]);
      expect(await shownFor(db, counsellor, { query: "330002" })).toEqual([
        "9986330002",
      ]);
    });
  });

  it("keeps only the consents waiting, or only those approved", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await addList(db);

      expect(await shownFor(db, counsellor, { filter: "waiting" })).toEqual([
        "9986330001",
      ]);
      expect(await shownFor(db, counsellor, { filter: "approved" })).toEqual([
        "9986330002",
      ]);
    });
  });

  it("keeps only those whose latest session sets a next one that has not passed", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);
      await addSession(
        db,
        ids.three,
        counsellor.id,
        "2026-10-01",
        "2026-10-08",
      );

      expect(
        await shownFor(db, counsellor, { filter: "next_session" }),
      ).toEqual(["9986330002"]);
    });
  });

  it("finds nobody when nothing matches", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await addList(db);

      const list = await readCounsellingList(
        db,
        counsellor,
        { ...ALL, query: "Tidak Ada", filter: "approved" },
        NOW,
      );

      expect(list).toEqual({ rows: [], matching: 0, page: 1 });
    });
  });
});

describe("the pages of Daftar mahasiswa", () => {
  it("loads 20 students at a time, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const nims = Array.from(
        { length: 21 },
        (_, place) => `99863300${String(place + 10).padStart(2, "0")}`,
      );
      const people = await addTestPeople(db, "Prodi Uji Halaman Daftar", nims);
      for (const studentId of people.studentIds) {
        await setTestConsent(db, studentId, people.counsellor.id, "waiting");
      }

      const first = await readCounsellingList(db, people.counsellor, ALL, NOW);
      const past = await readCounsellingList(
        db,
        people.counsellor,
        { ...ALL, page: 9 },
        NOW,
      );

      expect(first?.rows).toHaveLength(20);
      expect(first?.matching).toBe(21);
      expect(past?.page).toBe(2);
      expect(past?.rows).toHaveLength(1);
    });
  });
});

describe("the numbers of Daftar mahasiswa", () => {
  it("count the consents waiting and the sessions from 30 days ago up to today", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addList(db);
      await setTestConsent(db, ids.six, counsellor.id, "waiting");
      await addSession(db, ids.three, counsellor.id, "2026-09-21");
      await addSession(db, ids.three, counsellor.id, "2026-09-20");

      const numbers = await readCounsellingNumbers(db, counsellor, NOW);

      expect(numbers).toEqual({ waitingConsent: 2, recentSessions: 2 });
    });
  });

  it("are nought with nothing yet", async () => {
    await inTestDatabase(async (db) => {
      const counsellor = await addTestActor(db, "Konselor Uji Nol", [
        "counsellor",
      ]);

      const numbers = await readCounsellingNumbers(db, counsellor, NOW);

      expect(numbers).toEqual({ waitingConsent: 0, recentSessions: 0 });
    });
  });
});

const REFUSED: [string, RoleId][] = [
  ["Mahasiswa", "student"],
  ["Kepala Unit", "head_of_unit"],
  ["Direktur / Wakil Direktur", "director"],
  ["Ketua Program Studi", "head_of_program"],
  ["Pengasuh", "mentor"],
  ["Pembina Disiplin Mahasiswa", "discipline_officer"],
  ["Penilai Mahasiswa", "assessor"],
];

describe("a hand-made request for Daftar mahasiswa or its numbers", () => {
  it.each(REFUSED)(
    "is refused for %s, with nothing given back",
    async (_, role) => {
      await inTestDatabase(async (db) => {
        await addList(db);
        const other = await addTestActor(db, "Akun Uji Lain", [role]);

        expect(await readCounsellingList(db, other, ALL, NOW)).toBeNull();
        expect(await readCounsellingNumbers(db, other, NOW)).toBeNull();
      });
    },
  );
});
