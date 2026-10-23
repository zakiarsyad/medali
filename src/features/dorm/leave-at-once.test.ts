// Sample NIMs of this file: 9937850000 to 9937850099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { askLeave } from "./ask-leave";
import { cancelLeave } from "./cancel-leave";
import { decideLeave } from "./decide-leave";
import {
  LEAVE_OVERLAPS,
  tooLateToCancel,
  tooLateToDecide,
} from "./leave-messages";
import {
  addTestResidents,
  leaveById,
  leavesOf,
  sentOuting,
  type TestResident,
} from "./test-leave";
import { addTestActor } from "./test-records";

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
    ["9937850001", "9937850002", "9937850003", "9937850004", "9937850005"],
  );
  const found = residents[place];
  if (!found) throw new Error("There is no such resident.");
  return found;
}

/** A request of a resident that waits, and a Pengelola Asrama to decide it. */
async function waitingRequest(place: number) {
  const asker = await resident(place);
  const id = crypto.randomUUID();
  const saved = await askLeave(own.db, asker, id, sentOuting(TOMORROW), MOMENT);
  if (!saved.ok) throw new Error(saved.error);
  const manager = await addTestActor(own.db, `Pengelola Uji ${place}`, [
    "dorm_manager",
  ]);
  return { asker, id, manager };
}

describe("a cancel and a decision of one request at the same moment", () => {
  it("lets the cancel that comes first win: the approval waits, then is refused", async () => {
    const { asker, id, manager } = await waitingRequest(2);

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => cancelLeave(db, asker, id, MOMENT),
      (db) => decideLeave(db, manager, id, "approve", ""),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(tooLateToDecide("cancelled"));
    expect((await leaveById(own.db, id))?.status).toBe("cancelled");
  });

  it("lets the approval that comes first win: the cancel waits, then is refused", async () => {
    const { asker, id, manager } = await waitingRequest(3);

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => decideLeave(db, manager, id, "approve", ""),
      (db) => cancelLeave(db, asker, id, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: "approved" });
    expect(both.later).toEqual(tooLateToCancel("approved"));
    const kept = await leaveById(own.db, id);
    expect(kept?.status).toBe("approved");
    expect(kept?.cancelledAt).toBeNull();
  });
});

describe("one decision pressed twice at the same moment", () => {
  it("keeps one decision: the second waits, then is refused as decided first", async () => {
    const { id, manager } = await waitingRequest(4);

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => decideLeave(db, manager, id, "approve", ""),
      (db) => decideLeave(db, manager, id, "reject", "Ditekan dua kali."),
    );

    expect(both.sooner).toEqual({ ok: true, value: "approved" });
    expect(both.later).toEqual(tooLateToDecide("approved"));
    expect(both.later).toMatchObject({ stale: true });
    expect(await leaveById(own.db, id)).toMatchObject({
      status: "approved",
      decisionNote: "",
    });
  });
});

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
