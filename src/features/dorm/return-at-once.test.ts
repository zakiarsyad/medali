// Sample NIMs of this file: 9937920000 to 9937920099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { RETURN_PHOTO_FILE_NAME } from "./return-photo";
import { sendReturnReport } from "./send-return-report";
import { addTestResidents, type TestResident } from "./test-leave";
import { addTestActor } from "./test-records";
import { addApprovedLeave, campusAt, reportsOf } from "./test-returns";

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
