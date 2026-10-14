// Sample Tahun akademik of this file: 2880 to 2880.
// Sample NIMs of this file: 9937860000 to 9937860099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormLeaves, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestRoom, placeTestResident } from "@/dorms/test-records";
import { visibleTo } from "@/features/students/visible-students";
import type { LeaveFilters } from "./leave-address";
import { readLeaveBoard } from "./leave-list";
import { addTestActivity } from "./test-activities";
import { addTestResidents } from "./test-leave";
import { addTestActor, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2880.
const NOW = new Date("2880-10-12T03:00:00Z");

/** A time on campus, such as 2880-10-13T09:00, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const WAITING: LeaveFilters = { query: "", status: "submitted", kind: "all" };

type LeaveRow = typeof dormLeaves.$inferInsert;

async function addLeave(
  db: Database,
  studentId: string,
  start: string,
  end: string,
  more: Partial<LeaveRow> = {},
) {
  await db.insert(dormLeaves).values({
    id: crypto.randomUUID(),
    studentId,
    kind: "outing",
    startsAt: on(start),
    endsAt: on(end),
    purpose: "Membeli buku kuliah",
    destination: "Bintaro",
    contact: "0812",
    sentAt: NOW,
    ...more,
  });
}

async function addRecords(db: Database) {
  const [ani, bea, cici] = await addTestResidents(
    db,
    2880,
    "Prodi Uji Daftar Izin",
    ["9937860001", "9937860002", "9937860003"],
  );
  if (!ani || !bea || !cici) throw new Error("The residents were not added.");
  const manager = await addTestActor(db, "Pengelola Uji Daftar Izin", [
    "dorm_manager",
  ]);
  const roomId = await addTestRoom(db, { number: "U-IZIN-1" });
  await placeTestResident(db, roomId, ani.studentId);
  return { ani, bea, cici, manager };
}

describe("readLeaveBoard", () => {
  it("counts the requests that wait, and those approved that started in the last 30 days", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, manager } = await addRecords(db);
      const decided = { decidedBy: manager.id, decidedAt: NOW };
      await addLeave(db, ani.studentId, "2880-10-13T09:00", "2880-10-13T12:00");
      await addLeave(db, bea.studentId, "2880-10-14T09:00", "2880-10-14T12:00");
      await addLeave(
        db,
        ani.studentId,
        "2880-10-01T09:00",
        "2880-10-01T12:00",
        {
          status: "approved",
          ...decided,
        },
      );
      // More than 30 days before, and still to come: neither counts.
      await addLeave(
        db,
        ani.studentId,
        "2880-09-01T09:00",
        "2880-09-01T12:00",
        {
          status: "approved",
          ...decided,
        },
      );
      await addLeave(
        db,
        bea.studentId,
        "2880-10-20T09:00",
        "2880-10-20T12:00",
        {
          status: "approved",
          ...decided,
        },
      );

      const board = await readLeaveBoard(db, EVERYONE, WAITING, 1, NOW);

      expect(board.counts).toEqual({ waiting: 2, recentApproved: 1 });
    });
  });

  it("starts with those that wait, the soonest first, each with the student and where they live", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, cici } = await addRecords(db);
      await addLeave(db, bea.studentId, "2880-10-14T09:00", "2880-10-14T12:00");
      await addLeave(db, ani.studentId, "2880-10-13T09:00", "2880-10-13T12:00");
      await addLeave(
        db,
        cici.studentId,
        "2880-10-15T09:00",
        "2880-10-15T12:00",
        {
          status: "cancelled",
          cancelledAt: NOW,
        },
      );

      const { list } = await readLeaveBoard(db, EVERYONE, WAITING, 1, NOW);

      expect(list.matching).toBe(2);
      expect(list.cards.map((card) => card.name)).toEqual([
        "Penghuni Uji Izin 1",
        "Penghuni Uji Izin 2",
      ]);
      expect(list.cards[0]).toMatchObject({
        nim: "9937860001",
        room: "Asrama Dana Rakca, kamar U-IZIN-1",
        start: "13 Okt 2880, 09.00",
        length: "3 jam",
        destination: "Bintaro",
        warnings: [],
      });
      expect(list.cards[1]?.room).toBe("Asrama Dana Rakca, belum diplot");
    });
  });

  it("narrows by status, kind and a part of a name or NIM", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, manager } = await addRecords(db);
      await addLeave(db, ani.studentId, "2880-10-13T09:00", "2880-10-13T12:00");
      await addLeave(
        db,
        bea.studentId,
        "2880-10-13T19:00",
        "2880-10-13T21:00",
        {
          kind: "skip_activities",
          destination: "",
          contact: "",
        },
      );
      await addLeave(
        db,
        bea.studentId,
        "2880-10-01T09:00",
        "2880-10-01T12:00",
        {
          status: "rejected",
          decidedBy: manager.id,
          decidedAt: NOW,
          decisionNote: "Bertepatan dengan kerja bakti.",
        },
      );

      const skipping = await readLeaveBoard(
        db,
        EVERYONE,
        { ...WAITING, kind: "skip_activities" },
        1,
        NOW,
      );
      const rejected = await readLeaveBoard(
        db,
        EVERYONE,
        { ...WAITING, status: "rejected" },
        1,
        NOW,
      );
      const found = await readLeaveBoard(
        db,
        EVERYONE,
        { ...WAITING, status: "all", query: "860001" },
        1,
        NOW,
      );

      expect(skipping.list.cards.map((card) => card.kind)).toEqual([
        "skip_activities",
      ]);
      expect(rejected.list.cards[0]?.decision).toEqual({
        by: "Pengelola Uji Daftar Izin",
        note: "Bertepatan dengan kerja bakti.",
      });
      expect(found.list.cards.map((card) => card.nim)).toEqual(["9937860001"]);
    });
  });

  it("shows Ketua Program Studi only the requests of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea } = await addRecords(db);
      await addLeave(db, ani.studentId, "2880-10-13T09:00", "2880-10-13T12:00");
      const [student] = await db
        .select({ program: students.studyProgramId })
        .from(students)
        .where(eq(students.id, bea.studentId));
      if (!student) throw new Error("The student was not found.");
      const otherProgram = visibleTo({
        kind: "some",
        studyProgramIds: [student.program + 1000],
        menteesOf: [],
        studentIds: [],
      });
      const ownProgram = visibleTo({
        kind: "some",
        studyProgramIds: [student.program],
        menteesOf: [],
        studentIds: [],
      });

      const outside = await readLeaveBoard(db, otherProgram, WAITING, 1, NOW);
      const inside = await readLeaveBoard(db, ownProgram, WAITING, 1, NOW);

      expect(outside.counts.waiting).toBe(0);
      expect(outside.list.cards).toEqual([]);
      expect(inside.list.cards).toHaveLength(1);
    });
  });

  it("names the activities an ITMK covers, and warns of a start that has passed", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await addRecords(db);
      await addTestActivity(db, manager.id, {
        versions: [
          {
            name: "Belajar malam uji",
            startsOn: "2880-08-01",
            startTime: "19:30",
            endTime: "21:00",
          },
        ],
      });
      await addLeave(
        db,
        ani.studentId,
        "2880-10-12T09:00",
        "2880-10-12T21:30",
        {
          kind: "skip_activities",
          destination: "",
          contact: "",
        },
      );

      const { list } = await readLeaveBoard(db, EVERYONE, WAITING, 1, NOW);

      expect(list.cards[0]?.covered.map((each) => each.day)).toEqual([
        "2880-10-12",
      ]);
      expect(list.cards[0]?.warnings).toEqual(["Jam mulai sudah lewat."]);
    });
  });

  it("shows 20 cards a page, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      for (let day = 1; day <= 21; day++) {
        const date = `2880-11-${String(day).padStart(2, "0")}`;
        await addLeave(db, ani.studentId, `${date}T09:00`, `${date}T12:00`);
      }

      const first = await readLeaveBoard(db, EVERYONE, WAITING, 1, NOW);
      const beyond = await readLeaveBoard(db, EVERYONE, WAITING, 9, NOW);

      expect(first.list.cards).toHaveLength(20);
      expect(beyond.list.page).toBe(2);
      expect(beyond.list.cards.map((card) => card.start)).toEqual([
        "21 Nov 2880, 09.00",
      ]);
    });
  });
});
