// Sample Tahun akademik of this file: 2970 to 2970.
// Sample NIMs of this file: 9937960000 to 9937960099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import type { LeaveFilters } from "./leave-address";
import { readLeaveBoard } from "./leave-list";
import { recordReturn } from "./record-return";
import { addTestResidents } from "./test-leave";
import { addTestActor, EVERYONE } from "./test-records";
import { addApprovedLeave, addTestReport, campusAt } from "./test-returns";

const inTestDatabase = withTestDatabase();

// 17:00 on campus on 13 October 2970.
const NOW = campusAt("2970-10-13T17:00");

const EVERY: LeaveFilters = { query: "", status: "all", kind: "all" };

async function addRecords(db: Database) {
  const residents = await addTestResidents(
    db,
    2970,
    "Prodi Uji Papan Kembali",
    ["9937960001", "9937960002", "9937960003", "9937960004"],
  );
  const manager = await addTestActor(db, "Pengelola Uji Papan", [
    "dorm_manager",
  ]);
  const bam = await addTestActor(db, "BAM Uji Papan", ["bam_bphk"]);
  return { residents, manager, bam };
}

function idOf(residents: { studentId: string }[], place: number): string {
  const found = residents[place];
  if (!found) throw new Error("There is no such resident.");
  return found.studentId;
}

describe("the cards of leave and its return", () => {
  it("mark leave that is out, and not leave whose report waits or that has not started", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager } = await addRecords(db);
      const out = await addApprovedLeave(db, idOf(residents, 0), manager.id, {
        startsAt: "2970-10-13T09:00",
        endsAt: "2970-10-13T16:00",
      });
      const reported = await addApprovedLeave(
        db,
        idOf(residents, 1),
        manager.id,
        { startsAt: "2970-10-13T09:00", endsAt: "2970-10-13T18:00" },
      );
      await addTestReport(db, reported, "2970-10-13T16:50");
      const coming = await addApprovedLeave(
        db,
        idOf(residents, 2),
        manager.id,
        { startsAt: "2970-10-14T09:00", endsAt: "2970-10-14T16:00" },
      );

      const { list } = await readLeaveBoard(db, EVERYONE, EVERY, 1, NOW);
      const outOf = new Map(list.cards.map((card) => [card.id, card.isOut]));

      expect(outOf.get(out)).toBe(true);
      expect(outOf.get(reported)).toBe(false);
      expect(outOf.get(coming)).toBe(false);
      const withReport = list.cards.find((card) => card.id === reported);
      expect(withReport?.report).toMatchObject({
        status: "waiting",
        timeliness: { late: false, words: "Tepat waktu" },
      });
    });
  });

  it("show the actual return, how late, and who recorded it", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager, bam } = await addRecords(db);
      const leaveId = await addApprovedLeave(
        db,
        idOf(residents, 0),
        manager.id,
        { startsAt: "2970-10-13T09:00", endsAt: "2970-10-13T16:00" },
      );
      await recordReturn(db, bam, leaveId, "2970-10-13T16:20", NOW);

      const { list } = await readLeaveBoard(db, EVERYONE, EVERY, 1, NOW);

      expect(list.cards[0]).toMatchObject({
        status: "completed",
        isOut: false,
        returned: {
          at: "13 Okt 2970, 16.20",
          timeliness: { late: true, words: "Terlambat 20 menit" },
          recordedBy: "BAM Uji Papan",
        },
      });
    });
  });
});
