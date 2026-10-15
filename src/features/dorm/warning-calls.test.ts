// Sample Tahun akademik of this file: 3291 to 3291.
// Sample NIMs of this file: 9986101000 to 9986101099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestClarification } from "./test-clarifications";
import { EVERYONE } from "./test-records";
import {
  addTestAppeal,
  addTestViolation,
  addViolationActor,
  addViolationSetting,
} from "./test-violations";
import {
  addTestLetter,
  addTestRejection,
  addTestViolations,
  issuedBy,
  periodIdOf,
} from "./test-warnings";
import { readWarningCalls } from "./warning-calls";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3291.
const NOW = new Date("3291-10-20T03:00:00Z");

async function setUp(db: Database) {
  const setting = await addViolationSetting(
    db,
    3291,
    "Prodi Uji Panggilan SP",
    ["9986101001", "9986101002", "9986101003", "9986101004", "9986101005"],
  );
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Panggilan", ["bam_bphk"]);
  const periodId = await periodIdOf(db, 3291);
  return { ani, bea, cici, bamId: bam.id, periodId };
}

function read(db: Database, page = 1, visible = EVERYONE) {
  return readWarningCalls(db, visible, NOW, page);
}

function shown(calls: Awaited<ReturnType<typeof read>>) {
  return calls.calls.map((call) => [call.name, call.level, call.causes]);
}

describe("readWarningCalls", () => {
  it("calls a resident at 7 counted violations of the semester for SP 1, with the cause, and not at 6", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId } = await setUp(db);
      await addTestViolations(db, ani, bamId, 7, "3291-10-01");
      await addTestViolations(db, bea, bamId, 6, "3291-10-01");

      const calls = await read(db);

      expect(shown(calls)).toEqual([
        ["Ani Uji Pelanggaran", 1, ["7 pelanggaran tercatat"]],
      ]);
      expect(calls.calls[0]).toMatchObject({
        nim: "9986101001",
        counted: 7,
        mark: null,
        schedule: null,
        room: "Asrama Dana Rakca, belum diplot",
      });
      expect(calls.active).toBe(1);
      expect(calls.semester?.title).toContain("3291");
    });
  });

  it("does not count a violation in its appeal time, one with an appeal waiting or accepted, one cancelled, or one of another semester", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bamId } = await setUp(db);
      await addTestViolations(db, ani, bamId, 6, "3291-10-01");
      // Announced at 09:00 on campus today, an hour ago.
      await addTestViolation(db, ani, bamId, "3291-10-20", {
        announcedAt: new Date("3291-10-20T02:00:00Z"),
        enteredAt: new Date("3291-10-20T01:00:00Z"),
      });
      const waiting = await addTestViolation(db, ani, bamId, "3291-10-10");
      await addTestAppeal(db, waiting);
      const accepted = await addTestViolation(db, ani, bamId, "3291-10-11");
      await addTestAppeal(db, accepted, {
        status: "accepted",
        decidedBy: bamId,
        decidedAt: new Date("3291-10-12T03:00:00Z"),
      });
      await addTestViolation(db, ani, bamId, "3291-10-12", {
        enteredAt: new Date("3291-10-12T10:00:00Z"),
        cancelledBy: bamId,
        cancelledAt: new Date("3291-10-12T11:00:00Z"),
      });
      await addTestViolation(db, ani, bamId, "3291-07-20");

      expect((await read(db)).calls).toEqual([]);

      const rejected = await addTestViolation(db, ani, bamId, "3291-10-13");
      await addTestAppeal(db, rejected, {
        status: "rejected",
        decidedBy: bamId,
        decidedAt: new Date("3291-10-14T03:00:00Z"),
        decisionNote: "Tidak ada izin.",
      });
      expect(shown(await read(db))).toEqual([
        ["Ani Uji Pelanggaran", 1, ["7 pelanggaran tercatat"]],
      ]);
    });
  });

  it("calls a resident for SP 1 at one clarification rejected by BAM or by Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId } = await setUp(db);
      await addTestRejection(db, ani, bamId, "3291-10-05");
      await addTestRejection(db, bea, bamId, "3291-10-06", {
        decidedBy: bamId,
        decidedAt: new Date("3291-10-08T03:00:00Z"),
        decisionNote: "Tidak ada bukti.",
      });

      expect(shown(await read(db))).toEqual([
        ["Ani Uji Pelanggaran", 1, ["klarifikasi kehadiran ditolak"]],
        ["Bea Uji Pelanggaran", 1, ["klarifikasi kehadiran ditolak"]],
      ]);
    });
  });

  it("counts only the latest clarification of an activity: one accepted or sent again since no longer counts, and the resident leaves the list", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, cici, bamId } = await setUp(db);
      const later = new Date("3291-10-15T03:00:00Z");
      const ofAni = await addTestRejection(db, ani, bamId, "3291-10-05");
      await addTestClarification(db, bamId, {
        countId: ofAni.countId,
        studentId: ani,
        status: "accepted",
        sentAt: later,
      });
      const ofBea = await addTestRejection(db, bea, bamId, "3291-10-05");
      await addTestClarification(db, bamId, {
        countId: ofBea.countId,
        studentId: bea,
        sentAt: later,
      });
      await addTestRejection(db, cici, bamId, "3291-07-25");

      expect((await read(db)).calls).toEqual([]);
    });
  });

  it("after SP 1, calls for SP 2 at 12 counted violations in all or a second rejected clarification, with the mark SP 1", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, cici, bamId, periodId } = await setUp(db);
      for (const studentId of [ani, bea, cici]) {
        await addTestLetter(db, {
          studentId,
          periodId,
          level: 1,
          ...issuedBy(bamId),
        });
      }
      await addTestViolations(db, ani, bamId, 12, "3291-09-01");
      await addTestViolations(db, bea, bamId, 11, "3291-09-01");
      await addTestRejection(db, bea, bamId, "3291-10-05");
      await addTestRejection(db, cici, bamId, "3291-10-05");
      await addTestRejection(db, cici, bamId, "3291-10-06");

      const calls = await read(db);

      expect(shown(calls)).toEqual([
        ["Ani Uji Pelanggaran", 2, ["12 pelanggaran tercatat"]],
        [
          "Cici Uji Pelanggaran",
          2,
          ["klarifikasi kehadiran ditolak lagi (2 kali)"],
        ],
      ]);
      expect(calls.calls.map((call) => call.mark)).toEqual([1, 1]);
      expect(calls.withLetter).toBe(3);
    });
  });

  it("keeps an issued SP when its cause no longer counts, and calls for nothing more after SP 2", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId, periodId } = await setUp(db);
      const ofAni = await addTestRejection(db, ani, bamId, "3291-10-05");
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        ...issuedBy(bamId),
      });
      await addTestClarification(db, bamId, {
        countId: ofAni.countId,
        studentId: ani,
        status: "accepted",
        sentAt: new Date("3291-10-16T03:00:00Z"),
      });
      for (const level of [1, 2]) {
        await addTestLetter(db, {
          studentId: bea,
          periodId,
          level,
          ...issuedBy(bamId),
        });
      }
      await addTestViolations(db, bea, bamId, 20, "3291-09-01");

      const calls = await read(db);

      expect(calls.calls).toEqual([]);
      expect(calls.active).toBe(0);
      expect(calls.withLetter).toBe(2);
    });
  });

  it("shows the schedule of the call for the SP the resident is called for", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bamId, periodId } = await setUp(db);
      await addTestViolations(db, ani, bamId, 7, "3291-10-01");
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        callDay: "3291-10-21",
        callTime: "16:00",
        callPlace: "Kantor Pengelola Asrama",
      });

      const [call] = (await read(db)).calls;

      expect(call?.schedule).toEqual({
        day: "3291-10-21",
        time: "16:00",
        place: "Kantor Pengelola Asrama",
      });
    });
  });

  it("lists only the students the account sees", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId } = await setUp(db);
      await addTestViolations(db, ani, bamId, 7, "3291-10-01");
      await addTestViolations(db, bea, bamId, 7, "3291-10-01");

      const calls = await read(db, 1, eq(students.id, bea));

      expect(calls.calls.map((call) => call.studentId)).toEqual([bea]);
      expect(calls.active).toBe(1);
    });
  });
});
