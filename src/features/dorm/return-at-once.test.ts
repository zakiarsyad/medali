// Sample NIMs of this file: 9937920000 to 9937920099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import type { Parsed } from "@/parsed";
import { validateReturn, verifyReturn } from "./decide-return";
import { reportDecidedFirst } from "./return-messages";
import { RETURN_PHOTO_FILE_NAME } from "./return-photo";
import { sendReturnReport } from "./send-return-report";
import { addTestResidents, leaveById, type TestResident } from "./test-leave";
import { addTestActor } from "./test-records";
import {
  addApprovedLeave,
  addTestReport,
  campusAt,
  reportById,
  reportsOf,
} from "./test-returns";

/*
 * Two saves at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end, and each uses a resident of its own.
 */
const own = withOwnTestDatabase("lapor");

const PHOTO = {
  name: RETURN_PHOTO_FILE_NAME,
  bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]),
};

let residents: TestResident[] | undefined;

/** The residents, once for the file: angkatan 2930 lives in the dorm then. */
async function resident(place: number): Promise<TestResident> {
  residents ??= await addTestResidents(
    own.db,
    2930,
    "Prodi Uji Lapor Sekaligus",
    ["9937920001", "9937920002", "9937920003", "9937920004"],
  );
  const found = residents[place];
  if (!found) throw new Error("There is no such resident.");
  return found;
}

/** Approved Izin pesiar of a resident, out from 09:00 to 16:00 on 13 October 2930. */
async function outingOf(place: number) {
  const out = await resident(place);
  const manager = await addTestActor(own.db, `Pengelola Uji ${place}`, [
    "dorm_manager",
  ]);
  const leaveId = await addApprovedLeave(own.db, out.studentId, manager.id, {
    kind: "outing",
    startsAt: "2930-10-13T09:00",
    endsAt: "2930-10-13T16:00",
  });
  return { out, manager, leaveId };
}

const ON_TIME = campusAt("2930-10-13T15:50");

describe("a report of a return sent twice at the same moment", () => {
  it("is kept once: the second waits, then answers the same, and its photo is removed", async () => {
    const { out, leaveId } = await outingOf(0);
    const store = memoryStore();
    const reportId = crypto.randomUUID();
    const send = (db: Parameters<typeof sendReturnReport>[0]) =>
      sendReturnReport(db, store, out, leaveId, reportId, PHOTO, ON_TIME);

    const both = await own.atOnce(send, send);

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(both.sooner);
    expect(await reportsOf(own.db, leaveId)).toHaveLength(1);
    expect(store.files.size).toBe(1);
  });
});

/** A report of a resident's leave, sent on time, as BAM - BPHK left it. */
async function reportOf(place: number, status: "waiting" | "verified") {
  const { manager, leaveId } = await outingOf(place);
  const bam = await addTestActor(own.db, `BAM Uji ${place}`, ["bam_bphk"]);
  const otherBam = await addTestActor(own.db, `BAM Lain Uji ${place}`, [
    "bam_bphk",
  ]);
  const verified =
    status === "verified"
      ? { status, verifiedBy: bam.id, verifiedAt: new Date() }
      : {};
  const reportId = await addTestReport(
    own.db,
    leaveId,
    "2930-10-13T15:50",
    verified,
  );
  return { manager, bam, otherBam, leaveId, reportId };
}

describe("two decisions on one report at the same moment", () => {
  it("lets the rejection of one BAM - BPHK that comes first win: the verification of another waits, then is refused", async () => {
    const { bam, otherBam, reportId } = await reportOf(1, "waiting");

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => verifyReturn(db, bam, reportId, "reject", "Foto buram."),
      (db) => verifyReturn(db, otherBam, reportId, "verify", ""),
    );

    expect(both.sooner).toEqual({ ok: true, value: "rejected" });
    expect(both.later).toEqual(reportDecidedFirst("rejected"));
    expect((await reportById(own.db, reportId))?.verifiedBy).toBe(bam.id);
  });

  it("lets the validation that comes first win: a rejection of Pengelola Asrama at once waits, then is refused, and the leave stays Selesai", async () => {
    const { manager, leaveId, reportId } = await reportOf(2, "verified");

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => validateReturn(db, manager, reportId, "validate", ""),
      (db) => validateReturn(db, manager, reportId, "reject", "Bukan asrama."),
    );

    expect(both.sooner).toEqual({ ok: true, value: "validated" });
    expect(both.later).toEqual(reportDecidedFirst("validated"));
    expect((await leaveById(own.db, leaveId))?.status).toBe("completed");
  });
});
