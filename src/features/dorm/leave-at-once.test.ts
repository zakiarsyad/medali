// Sample NIMs of this file: 9937850000 to 9937850099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { askLeave } from "./ask-leave";
import { LEAVE_OVERLAPS } from "./leave-messages";
import {
  addTestResidents,
  leavesOf,
  sentOuting,
  type TestResident,
} from "./test-leave";

/*
 * Two requests at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end, and each uses a resident of its own.
 */
const own = withOwnTestDatabase("izinasrama");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");
const TOMORROW = "2026-10-13";

let residents: TestResident[] | undefined;

/** The residents, once for the file: angkatan 2026 lives in the dorm then. */
async function resident(place: number): Promise<TestResident> {
  residents ??= await addTestResidents(
    own.db,
    2026,
    "Prodi Uji Izin Sekaligus",
    ["9937850001", "9937850002", "9937850003", "9937850004"],
  );
  const found = residents[place];
  if (!found) throw new Error("There is no such resident.");
  return found;
}

describe("two requests of one resident at the same moment", () => {
  it("keeps a form pressed twice once: the second waits, then answers the same", async () => {
    const ani = await resident(0);
    const id = crypto.randomUUID();
    const sent = sentOuting(TOMORROW);

    const both = await own.atOnce(
      (db) => askLeave(db, ani, id, sent, MOMENT),
      (db) => askLeave(db, ani, id, sent, MOMENT),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(both.sooner);
    expect(await leavesOf(own.db, ani.studentId)).toHaveLength(1);
  });

  it("never keeps two that overlap: the second waits, then is refused", async () => {
    const bea = await resident(1);

    const both = await own.atOnce(
      (db) =>
        askLeave(db, bea, crypto.randomUUID(), sentOuting(TOMORROW), MOMENT),
      (db) =>
        askLeave(
          db,
          bea,
          crypto.randomUUID(),
          sentOuting(TOMORROW, { startsAt: `${TOMORROW}T10:00` }),
          MOMENT,
        ),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(LEAVE_OVERLAPS);
    expect(await leavesOf(own.db, bea.studentId)).toHaveLength(1);
  });
});
