// Sample Tahun akademik of this file: 2920 to 2920.
// Sample NIMs of this file: 9937910000 to 9937910099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore } from "@/files/memory-store";
import { LEAVE_NOT_FOUND } from "./leave-messages";
import { readOwnLeave } from "./own-leave";
import {
  NEEDS_NO_REPORT,
  NO_RETURN_PHOTO_STORAGE,
  REPORT_ALREADY_SENT,
  REPORT_NOT_ALLOWED,
  REPORT_WAITS,
  reportNotOpen,
  reportSentWords,
} from "./return-messages";
import { RETURN_PHOTO_FAULTS, RETURN_PHOTO_FILE_NAME } from "./return-photo";
import { sendReturnReport } from "./send-return-report";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";
import {
  addApprovedLeave,
  addTestReport,
  campusAt,
  reportsOf,
} from "./test-returns";

const inTestDatabase = withTestDatabase();

/** A made-up photo: bytes that start as a JPEG does. It is a picture of nobody. */
function photo(bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])) {
  return { name: RETURN_PHOTO_FILE_NAME, bytes };
}

async function addRecords(db: Database) {
  const [ani, bea] = await addTestResidents(db, 2920, "Prodi Uji Lapor", [
    "9937910001",
    "9937910002",
  ]);
  if (!ani || !bea) throw new Error("The residents were not added.");
  const manager = await addTestActor(db, "Pengelola Uji Lapor", [
    "dorm_manager",
  ]);
  const leaveId = await addApprovedLeave(db, ani.studentId, manager.id, {
    kind: "outing",
    startsAt: "2920-10-13T09:00",
    endsAt: "2920-10-13T16:00",
  });
  return { ani, bea, manager, leaveId };
}

const ON_TIME = campusAt("2920-10-13T15:50");

describe("sendReturnReport", () => {
  it("keeps a report that waits for BAM, at the server's time, with its photo", async () => {
    await inTestDatabase(async (db) => {
      const { ani, leaveId } = await addRecords(db);
      const store = memoryStore();
      const reportId = crypto.randomUUID();

      const sent = await sendReturnReport(
        db,
        store,
        ani,
        leaveId,
        reportId,
        photo(),
        ON_TIME,
      );

      expect(sent).toEqual({ ok: true, value: reportSentWords(0) });
      const [kept] = await reportsOf(db, leaveId);
      expect(kept).toMatchObject({
        id: reportId,
        status: "waiting",
        sentAt: ON_TIME,
        verifiedBy: null,
      });
      expect(kept?.photoKey).toMatch(/^return-photos\//);
      expect(store.files.size).toBe(1);
    });
  });

  it("says how many minutes late a report after the return time is", async () => {
    await inTestDatabase(async (db) => {
      const { ani, leaveId } = await addRecords(db);

      const sent = await sendReturnReport(
        db,
        memoryStore(),
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(),
        campusAt("2920-10-13T16:25"),
      );

      expect(sent).toEqual({ ok: true, value: reportSentWords(25) });
    });
  });

  it("refuses a report before it opens, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { ani, leaveId } = await addRecords(db);
      const store = memoryStore();

      const sent = await sendReturnReport(
        db,
        store,
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(),
        campusAt("2920-10-13T15:29"),
      );

      expect(sent).toEqual(reportNotOpen("13 Okt 2920, 15.30"));
      expect(await reportsOf(db, leaveId)).toEqual([]);
      expect(store.files.size).toBe(0);
    });
  });

  it("answers a report for another resident's leave as one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { bea, leaveId } = await addRecords(db);

      const sent = await sendReturnReport(
        db,
        memoryStore(),
        bea,
        leaveId,
        crypto.randomUUID(),
        photo(),
        ON_TIME,
      );

      expect(sent).toEqual(LEAVE_NOT_FOUND);
      expect(await reportsOf(db, leaveId)).toEqual([]);
    });
  });

  it("refuses a role without the right, even with a student of its own", async () => {
    await inTestDatabase(async (db) => {
      const { ani, leaveId } = await addRecords(db);

      const sent = await sendReturnReport(
        db,
        memoryStore(),
        { roles: ["head_of_unit"], studentId: ani.studentId },
        leaveId,
        crypto.randomUUID(),
        photo(),
        ON_TIME,
      );

      expect(sent).toEqual(REPORT_NOT_ALLOWED);
    });
  });

  it("asks no report for ITMK", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await addRecords(db);
      const itmkId = await addApprovedLeave(db, ani.studentId, manager.id, {
        kind: "skip_activities",
        startsAt: "2920-10-14T19:00",
        endsAt: "2920-10-14T21:00",
      });

      const sent = await sendReturnReport(
        db,
        memoryStore(),
        ani,
        itmkId,
        crypto.randomUUID(),
        photo(),
        campusAt("2920-10-14T20:50"),
      );

      expect(sent).toEqual(NEEDS_NO_REPORT);
    });
  });

  it("refuses a second report while one waits, and takes a new one after a rejection", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, leaveId } = await addRecords(db);
      const store = memoryStore();
      await sendReturnReport(
        db,
        store,
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(),
        ON_TIME,
      );

      const second = await sendReturnReport(
        db,
        store,
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(),
        ON_TIME,
      );
      expect(second).toEqual(REPORT_WAITS);
      expect(store.files.size).toBe(1);

      const other = await addApprovedLeave(db, ani.studentId, manager.id, {
        startsAt: "2920-10-15T09:00",
        endsAt: "2920-10-15T16:00",
      });
      await addTestReport(db, other, "2920-10-15T15:40", {
        status: "rejected",
        verifiedBy: manager.id,
        verifiedAt: new Date(),
        verifyNote: "Foto tidak menunjukkan asrama.",
      });
      const again = await sendReturnReport(
        db,
        store,
        ani,
        other,
        crypto.randomUUID(),
        photo(),
        campusAt("2920-10-15T15:45"),
      );
      expect(again.ok).toBe(true);
      expect(await reportsOf(db, other)).toHaveLength(2);
    });
  });

  it("keeps a report sent twice once, with the same answer, and refuses its key for another leave", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, leaveId } = await addRecords(db);
      const store = memoryStore();
      const reportId = crypto.randomUUID();
      const send = () =>
        sendReturnReport(db, store, ani, leaveId, reportId, photo(), ON_TIME);

      const first = await send();
      const second = await send();

      expect(second).toEqual(first);
      expect(await reportsOf(db, leaveId)).toHaveLength(1);
      expect(store.files.size).toBe(1);

      const other = await addApprovedLeave(db, ani.studentId, manager.id, {
        startsAt: "2920-10-15T09:00",
        endsAt: "2920-10-15T16:00",
      });
      expect(
        await sendReturnReport(
          db,
          store,
          ani,
          other,
          reportId,
          photo(),
          campusAt("2920-10-15T15:45"),
        ),
      ).toEqual(REPORT_ALREADY_SENT);
    });
  });

  it("keeps nothing where file keeping is off, and says so", async () => {
    await inTestDatabase(async (db) => {
      const { ani, leaveId } = await addRecords(db);

      const sent = await sendReturnReport(
        db,
        null,
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(),
        ON_TIME,
      );

      expect(sent).toEqual(NO_RETURN_PHOTO_STORAGE);
      expect(await reportsOf(db, leaveId)).toEqual([]);
    });
  });

  it("shows the report in Riwayat izin saya as it waits, and the note of a rejected one", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, leaveId } = await addRecords(db);
      await sendReturnReport(
        db,
        memoryStore(),
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(),
        campusAt("2920-10-13T16:05"),
      );
      const other = await addApprovedLeave(db, ani.studentId, manager.id, {
        startsAt: "2920-10-12T09:00",
        endsAt: "2920-10-12T16:00",
      });
      await addTestReport(db, other, "2920-10-12T15:40", {
        status: "rejected",
        verifiedBy: manager.id,
        verifiedAt: new Date(),
        verifyNote: "Foto tidak menunjukkan asrama.",
      });

      const answer = await readOwnLeave(
        db,
        ani,
        1,
        campusAt("2920-10-13T16:10"),
      );

      if (answer.kind !== "shown") throw new Error("The history was refused.");
      expect(answer.leave.rows.map((row) => row.return)).toEqual([
        {
          kind: "sent",
          status: "waiting",
          sentAt: "13 Okt 2920, 16.05",
          timeliness: { late: true, words: "Terlambat 5 menit" },
        },
        { kind: "open", rejectionNote: "Foto tidak menunjukkan asrama." },
      ]);
    });
  });

  it("refuses what is not a JPEG picture", async () => {
    await inTestDatabase(async (db) => {
      const { ani, leaveId } = await addRecords(db);

      const sent = await sendReturnReport(
        db,
        memoryStore(),
        ani,
        leaveId,
        crypto.randomUUID(),
        photo(new TextEncoder().encode("bukan gambar")),
        ON_TIME,
      );

      expect(sent).toEqual({
        ok: false,
        error: RETURN_PHOTO_FAULTS["wrong-content"],
      });
    });
  });
});
