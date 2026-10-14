// Sample Tahun akademik of this file: 2917 to 2917.
// Sample NIMs of this file: 9964001800 to 9964001899.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readRequestBoard } from "./request-board";
import { addTestRequest } from "./test-requests";
import {
  addTestActor,
  addTestEntry,
  addTestGroup,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

function seenBy(account: AccountForAccess) {
  return visibleTo(rowLimitForAction(account, "view_siku"));
}

const sentOn = (day: number) =>
  new Date(`2917-10-${String(day).padStart(2, "0")}T12:00:00Z`);

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2917);
  const own = await addTestStudents(db, "Prodi Uji Papan Pengajuan", 2917, [
    "9964001801",
    "9964001802",
  ]);
  const other = await addTestStudents(
    db,
    "Prodi Uji Papan Pengajuan Lain",
    2917,
    ["9964001803"],
  );
  const [ani = "", budi = ""] = own.studentIds;
  const [citra = ""] = other.studentIds;
  const penilai = await addTestActor(db, "Penilai Uji Papan", ["assessor"]);
  const mentor = await addTestActor(db, "Pengasuh Uji Papan", ["mentor"]);
  await addTestGroup(
    db,
    { programId: own.programId, year: 2917, number: 1 },
    mentor.id,
    [ani],
  );
  const head = await addTestActor(db, "KP Uji Papan", ["head_of_program"], {
    studyProgramId: own.programId,
  });
  return { periods, ani, budi, citra, penilai, mentor, head };
}

async function gainOf(
  db: Database,
  by: TestActor,
  periodId: string,
  studentId: string,
  more: { day?: string; cancelled?: boolean } = {},
) {
  return addTestEntry(db, by, {
    kind: "gain",
    reason: "knowledge_sharing",
    points: 3,
    day: more.day ?? "2917-10-10",
    periodId,
    studentIds: [studentId],
    cancelled: more.cancelled ?? false,
  });
}

describe("readRequestBoard", () => {
  it("counts each status of the requests seen, Dibatalkan under Semua only, and shows the chosen ones newest first", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, budi, penilai } = await addRecords(db);
      const decided = {
        decidedBy: penilai.id,
        decidedAs: "assessor",
        decidedAt: sentOn(14),
      } as const;
      const older = await addTestRequest(db, ani, { sentAt: sentOn(11) });
      const newer = await addTestRequest(db, budi, { sentAt: sentOn(12) });
      const approved = await addTestRequest(db, ani, {
        sentAt: sentOn(13),
        more: {
          ...decided,
          status: "approved",
          entryId: await gainOf(db, penilai, periods.odd, ani),
        },
      });
      const cancelled = await addTestRequest(db, ani, {
        sentAt: sentOn(9),
        more: {
          ...decided,
          status: "approved",
          entryId: await gainOf(db, penilai, periods.odd, ani, {
            cancelled: true,
          }),
        },
      });
      const rejected = await addTestRequest(db, budi, {
        sentAt: sentOn(8),
        more: { ...decided, status: "rejected", decisionNote: "Tidak sesuai." },
      });
      await addTestRequest(db, budi, {
        more: { status: "withdrawn", withdrawnAt: sentOn(14) },
      });
      const visible = seenBy(penilai);

      const waiting = await readRequestBoard(db, visible, "waiting", 1);
      const all = await readRequestBoard(db, visible, "all", 1);
      const onlyApproved = await readRequestBoard(db, visible, "approved", 1);

      expect(waiting.counts).toEqual({
        waiting: 2,
        approved: 1,
        rejected: 1,
        all: 5,
      });
      expect(waiting.cards.map((card) => card.id)).toEqual([newer, older]);
      expect(waiting.cards[0]).toMatchObject({
        name: "Mahasiswa Uji SIKU 2",
        nim: "9964001802",
        program: "Prodi Uji Papan Pengajuan",
        status: "waiting",
        decidedBy: null,
      });
      expect(onlyApproved.cards).toMatchObject([
        {
          id: approved,
          status: "approved",
          points: 3,
          decidedBy: "Penilai Uji Papan",
        },
      ]);
      expect(all.cards.map((card) => [card.id, card.status])).toEqual([
        [approved, "approved"],
        [newer, "waiting"],
        [older, "waiting"],
        [cancelled, "cancelled"],
        [rejected, "rejected"],
      ]);
    });
  });

  it("shows Ketua Program Studi the requests of their own program and Pengasuh those of their own mentees only", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, citra, mentor, head } = await addRecords(db);
      const ofAni = await addTestRequest(db, ani);
      const ofBudi = await addTestRequest(db, budi);
      await addTestRequest(db, citra);

      const ofHead = await readRequestBoard(db, seenBy(head), "waiting", 1);
      const ofMentor = await readRequestBoard(db, seenBy(mentor), "waiting", 1);

      expect(ofHead.cards.map((card) => card.id).sort()).toEqual(
        [ofAni, ofBudi].sort(),
      );
      expect(ofHead.counts.all).toBe(2);
      expect(ofMentor.cards.map((card) => card.id)).toEqual([ofAni]);
    });
  });

  it("leaves out the requests of a student who is not Aktif, as the tab counts Aktif students only", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      await addTestRequest(db, ani);
      await addTestRequest(db, budi);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, budi));

      const board = await readRequestBoard(db, seenBy(penilai), "waiting", 1);

      expect(board.counts.waiting).toBe(1);
      expect(board.cards).toHaveLength(1);
    });
  });

  it("shows 12 cards a page", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);
      for (let day = 1; day <= 13; day += 1) {
        await addTestRequest(db, ani, { sentAt: sentOn(day) });
      }

      const first = await readRequestBoard(db, seenBy(penilai), "waiting", 1);
      const second = await readRequestBoard(db, seenBy(penilai), "waiting", 2);

      expect(first.cards).toHaveLength(12);
      expect(first.matching).toBe(13);
      expect(second.cards).toHaveLength(1);
      expect(second.page).toBe(2);
    });
  });

  it("warns when the student has a gain in force with the same reason on the same day, and not of the request's own gain", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, budi, citra, penilai } = await addRecords(db);
      await gainOf(db, penilai, periods.odd, ani);
      await gainOf(db, penilai, periods.odd, budi, { cancelled: true });
      await gainOf(db, penilai, periods.odd, citra, { day: "2917-10-11" });
      const onDay = { day: "2917-10-10" };
      const ofAni = await addTestRequest(db, ani, onDay);
      const ofBudi = await addTestRequest(db, budi, onDay);
      const ofCitra = await addTestRequest(db, citra, onDay);
      const ownGain = await addTestRequest(db, citra, {
        day: "2917-10-11",
        more: {
          status: "approved",
          decidedBy: penilai.id,
          decidedAs: "assessor",
          decidedAt: sentOn(12),
          entryId: await gainOf(db, penilai, periods.odd, citra, {
            day: "2917-10-11",
          }),
        },
      });

      const board = await readRequestBoard(db, seenBy(penilai), "all", 1);
      const warns = new Map(
        board.cards.map((card) => [card.id, card.hasSameGain]),
      );

      expect(warns.get(ofAni)).toBe(true);
      expect(warns.get(ofBudi)).toBe(false);
      expect(warns.get(ofCitra)).toBe(false);
      expect(warns.get(ownGain)).toBe(true);
    });
  });
});
