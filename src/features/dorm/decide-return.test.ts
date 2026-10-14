// Sample Tahun akademik of this file: 2940 to 2940.
// Sample NIMs of this file: 9937930000 to 9937930099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { NOTE_TOO_LONG } from "./decide-leave";
import { validateReturn, verifyReturn } from "./decide-return";
import { REJECTION_NEEDS_NOTE } from "./leave-messages";
import {
  NO_VERIFY_DECISION,
  REPORT_NOT_FOUND,
  reportDecidedFirst,
  STILL_WAITS_FOR_BAM,
  VALIDATE_NOT_ALLOWED,
  VERIFY_NOT_ALLOWED,
} from "./return-messages";
import { addTestResidents, leaveById } from "./test-leave";
import { addTestActor } from "./test-records";
import {
  addApprovedLeave,
  addTestReport,
  campusAt,
  reportById,
} from "./test-returns";

const inTestDatabase = withTestDatabase();

/** Izin pesiar out until 16:00 on 13 October 2940, its report sent at 16:12. */
async function addRecords(db: Database) {
  const [ani] = await addTestResidents(db, 2940, "Prodi Uji Periksa Lapor", [
    "9937930001",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  const manager = await addTestActor(db, "Pengelola Uji Periksa", [
    "dorm_manager",
  ]);
  const bam = await addTestActor(db, "BAM Uji Periksa", ["bam_bphk"]);
  const head = await addTestActor(db, "Kepala Uji Periksa", ["head_of_unit"]);
  const leaveId = await addApprovedLeave(db, ani.studentId, manager.id, {
    kind: "outing",
    startsAt: "2940-10-13T09:00",
    endsAt: "2940-10-13T16:00",
  });
  const reportId = await addTestReport(db, leaveId, "2940-10-13T16:12");
  return { manager, bam, head, leaveId, reportId };
}

describe("verifyReturn", () => {
  it("moves a report that waits on to Pengelola Asrama, with who, when and the note", async () => {
    await inTestDatabase(async (db) => {
      const { bam, reportId } = await addRecords(db);

      const verified = await verifyReturn(
        db,
        bam,
        reportId,
        "verify",
        "  Foto jelas.  ",
      );

      expect(verified).toEqual({ ok: true, value: "verified" });
      const kept = await reportById(db, reportId);
      expect(kept).toMatchObject({
        status: "verified",
        verifiedBy: bam.id,
        verifyNote: "Foto jelas.",
      });
      expect(kept?.verifiedAt).toBeInstanceOf(Date);
    });
  });

  it("rejects only with a note", async () => {
    await inTestDatabase(async (db) => {
      const { bam, reportId } = await addRecords(db);

      expect(await verifyReturn(db, bam, reportId, "reject", "  ")).toEqual(
        REJECTION_NEEDS_NOTE,
      );
      expect(
        await verifyReturn(db, bam, reportId, "reject", "Foto buram."),
      ).toEqual({ ok: true, value: "rejected" });
      expect((await reportById(db, reportId))?.verifyNote).toBe("Foto buram.");
    });
  });

  it("refuses a hand-made verification of Kepala Unit and of Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      const { head, manager, reportId } = await addRecords(db);

      for (const actor of [head, manager]) {
        expect(await verifyReturn(db, actor, reportId, "verify", "")).toEqual(
          VERIFY_NOT_ALLOWED,
        );
      }
      expect((await reportById(db, reportId))?.status).toBe("waiting");
    });
  });

  it("refuses a report that BAM already decided, saying how, and what is not a decision or too long a note", async () => {
    await inTestDatabase(async (db) => {
      const { bam, reportId } = await addRecords(db);
      await verifyReturn(db, bam, reportId, "verify", "");

      expect(await verifyReturn(db, bam, reportId, "reject", "Buram.")).toEqual(
        reportDecidedFirst("verified"),
      );
      expect(await verifyReturn(db, bam, reportId, "validate", "")).toEqual(
        NO_VERIFY_DECISION,
      );
      expect(
        await verifyReturn(db, bam, reportId, "verify", "a".repeat(501)),
      ).toEqual(NOTE_TOO_LONG);
      expect(
        await verifyReturn(db, bam, crypto.randomUUID(), "verify", ""),
      ).toEqual(REPORT_NOT_FOUND);
    });
  });
});

describe("validateReturn", () => {
  it("makes the leave Selesai with the time of the report as its return", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, leaveId, reportId } = await addRecords(db);
      await verifyReturn(db, bam, reportId, "verify", "");

      const validated = await validateReturn(
        db,
        manager,
        reportId,
        "validate",
        "",
      );

      expect(validated).toEqual({ ok: true, value: "validated" });
      expect(await reportById(db, reportId)).toMatchObject({
        status: "validated",
        validatedBy: manager.id,
      });
      expect(await leaveById(db, leaveId)).toMatchObject({
        status: "completed",
        returnedAt: campusAt("2940-10-13T16:12"),
        returnRecordedBy: null,
      });
    });
  });

  it("rejects only with a note, and leaves the leave out", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, leaveId, reportId } = await addRecords(db);
      await verifyReturn(db, bam, reportId, "verify", "");

      expect(await validateReturn(db, manager, reportId, "reject", "")).toEqual(
        REJECTION_NEEDS_NOTE,
      );
      expect(
        await validateReturn(
          db,
          manager,
          reportId,
          "reject",
          "Bukan di asrama.",
        ),
      ).toEqual({ ok: true, value: "rejected" });
      expect(await reportById(db, reportId)).toMatchObject({
        status: "rejected",
        validateNote: "Bukan di asrama.",
      });
      expect((await leaveById(db, leaveId))?.status).toBe("approved");
    });
  });

  it("tells Pengelola Asrama that a report still waits for BAM", async () => {
    await inTestDatabase(async (db) => {
      const { manager, reportId } = await addRecords(db);

      expect(
        await validateReturn(db, manager, reportId, "validate", ""),
      ).toEqual(STILL_WAITS_FOR_BAM);
    });
  });

  it("refuses a hand-made validation of BAM - BPHK", async () => {
    await inTestDatabase(async (db) => {
      const { bam, leaveId, reportId } = await addRecords(db);
      await verifyReturn(db, bam, reportId, "verify", "");

      expect(await validateReturn(db, bam, reportId, "validate", "")).toEqual(
        VALIDATE_NOT_ALLOWED,
      );
      expect((await leaveById(db, leaveId))?.status).toBe("approved");
    });
  });

  it("refuses a rejection of BAM - BPHK sent after Pengelola Asrama validated", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, leaveId, reportId } = await addRecords(db);
      await verifyReturn(db, bam, reportId, "verify", "");
      await validateReturn(db, manager, reportId, "validate", "");

      expect(
        await verifyReturn(db, bam, reportId, "reject", "Foto buram."),
      ).toEqual(reportDecidedFirst("validated"));
      expect((await leaveById(db, leaveId))?.status).toBe("completed");
    });
  });

  it("refuses a report already validated", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, reportId } = await addRecords(db);
      await verifyReturn(db, bam, reportId, "verify", "");
      await validateReturn(db, manager, reportId, "validate", "");

      expect(
        await validateReturn(db, manager, reportId, "reject", "Salah."),
      ).toEqual(reportDecidedFirst("validated"));
    });
  });
});
