// Sample Tahun akademik of this file: 2960 to 2960.
// Sample NIMs of this file: 9937950000 to 9937950099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { LEAVE_NOT_FOUND } from "./leave-messages";
import { OWN_RECORD } from "./own-record";
import { recordReturn } from "./record-return";
import {
  RECORD_NOT_ALLOWED,
  REPORT_STILL_WAITS,
  RETURN_BEFORE_START,
  RETURN_IN_FUTURE,
  RETURN_RECORDED_FIRST,
  RETURN_TIME_NEEDED,
  returnRecordedWords,
} from "./return-messages";
import { addTestResidents, leaveById } from "./test-leave";
import { addTestActor } from "./test-records";
import { addApprovedLeave, addTestReport, campusAt } from "./test-returns";

const inTestDatabase = withTestDatabase();

const NOW = campusAt("2960-10-13T17:00");

/** Izin pesiar out from 09:00 to 16:00 on 13 October 2960. */
async function addRecords(db: Database) {
  const [ani] = await addTestResidents(db, 2960, "Prodi Uji Catat Kembali", [
    "9937950001",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  const manager = await addTestActor(db, "Pengelola Uji Catat", [
    "dorm_manager",
  ]);
  const bam = await addTestActor(db, "BAM Uji Catat", ["bam_bphk"]);
  const head = await addTestActor(db, "Kepala Uji Catat", ["head_of_unit"]);
  const leaveId = await addApprovedLeave(db, ani.studentId, manager.id, {
    kind: "outing",
    startsAt: "2960-10-13T09:00",
    endsAt: "2960-10-13T16:00",
  });
  return { studentId: ani.studentId, manager, bam, head, leaveId };
}

describe("recordReturn", () => {
  it("makes leave that is out Selesai, back at the time given, with who recorded it", async () => {
    await inTestDatabase(async (db) => {
      const { bam, leaveId } = await addRecords(db);

      const recorded = await recordReturn(
        db,
        bam,
        leaveId,
        "2960-10-13T16:20",
        NOW,
      );

      expect(recorded).toEqual({
        ok: true,
        value: returnRecordedWords("13 Okt 2960, 16.20", 20),
      });
      expect(await leaveById(db, leaveId)).toMatchObject({
        status: "completed",
        returnedAt: campusAt("2960-10-13T16:20"),
        returnRecordedBy: bam.id,
      });
    });
  });

  it("lets Pengelola Asrama record an early return too", async () => {
    await inTestDatabase(async (db) => {
      const { manager, leaveId } = await addRecords(db);

      expect(
        await recordReturn(db, manager, leaveId, "2960-10-13T12:00", NOW),
      ).toEqual({
        ok: true,
        value: returnRecordedWords("13 Okt 2960, 12.00", 0),
      });
    });
  });

  it("refuses a time in the future, before the departure, or not filled in", async () => {
    await inTestDatabase(async (db) => {
      const { bam, leaveId } = await addRecords(db);

      expect(
        await recordReturn(db, bam, leaveId, "2960-10-13T17:01", NOW),
      ).toEqual(RETURN_IN_FUTURE);
      expect(
        await recordReturn(db, bam, leaveId, "2960-10-13T08:59", NOW),
      ).toEqual(RETURN_BEFORE_START);
      expect(await recordReturn(db, bam, leaveId, "", NOW)).toEqual(
        RETURN_TIME_NEEDED,
      );
      expect((await leaveById(db, leaveId))?.status).toBe("approved");
    });
  });

  it("refuses leave whose report waits, and a return recorded already", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, bam, manager, leaveId } = await addRecords(db);
      await addTestReport(db, leaveId, "2960-10-13T15:50");

      expect(
        await recordReturn(db, bam, leaveId, "2960-10-13T16:00", NOW),
      ).toEqual(REPORT_STILL_WAITS);

      const other = await addApprovedLeave(db, studentId, manager.id, {
        startsAt: "2960-10-12T09:00",
        endsAt: "2960-10-12T16:00",
      });
      await recordReturn(db, manager, other, "2960-10-12T16:00", NOW);
      expect(
        await recordReturn(db, bam, other, "2960-10-12T16:05", NOW),
      ).toEqual(RETURN_RECORDED_FIRST);
    });
  });

  it("refuses a resident who is also BAM - BPHK their own late leave, also with its key in capitals, and keeps it out", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, bam, leaveId } = await addRecords(db);
      const own = await addTestActor(
        db,
        "Ani BAM Uji Catat",
        ["student", "bam_bphk"],
        studentId,
      );

      for (const key of [leaveId, leaveId.toUpperCase()]) {
        expect(
          await recordReturn(db, own, key, "2960-10-13T15:00", NOW),
        ).toEqual(OWN_RECORD);
      }
      expect(await leaveById(db, leaveId)).toMatchObject({
        status: "approved",
        returnedAt: null,
        returnRecordedBy: null,
      });
      expect(
        await recordReturn(db, bam, leaveId, "2960-10-13T16:20", NOW),
      ).toMatchObject({ ok: true });
    });
  });

  it("refuses a role that may not record, Kepala Unit among them, and leave that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { head, bam, leaveId } = await addRecords(db);

      expect(
        await recordReturn(db, head, leaveId, "2960-10-13T16:20", NOW),
      ).toEqual(RECORD_NOT_ALLOWED);
      expect(
        await recordReturn(
          db,
          bam,
          crypto.randomUUID(),
          "2960-10-13T16:20",
          NOW,
        ),
      ).toEqual(LEAVE_NOT_FOUND);
      expect((await leaveById(db, leaveId))?.status).toBe("approved");
    });
  });
});
