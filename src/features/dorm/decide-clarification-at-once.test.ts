// Sample Tahun akademik of this file: 3070 to 3070.
// Sample NIMs of this file: 9937980800 to 9937980899.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { DECIDED_FIRST } from "./clarification-decision";
import { decideDormClarification } from "./decide-clarification";
import { addTestActivity } from "./test-activities";
import {
  addTestClarification,
  addTestCount,
  changesOf,
  clarificationById,
} from "./test-clarifications";
import { addTestResidents, type TestResident } from "./test-leave";
import { addTestActor } from "./test-records";

/*
 * Two decisions at the same moment need two connections that both see
 * the saved rows, so these checks have a database of their own, dropped
 * at the end, and each uses a resident of its own.
 */
const own = withOwnTestDatabase("putusklarasrama");

let residents: TestResident[] | undefined;

async function clarificationOf(
  place: number,
  status: "submitted" | "verified",
) {
  residents ??= await addTestResidents(
    own.db,
    3070,
    "Prodi Uji Putus Sekaligus",
    ["9937980801", "9937980802"],
  );
  const resident = residents[place];
  if (!resident) throw new Error("There is no such resident.");
  const bam = await addTestActor(own.db, `BAM Uji Sekaligus ${place}`, [
    "bam_bphk",
  ]);
  const ki = await addTestActor(own.db, `BAM KI Uji Sekaligus ${place}`, [
    "bam_compliance",
  ]);
  const manager = await addTestActor(
    own.db,
    `Pengelola Uji Sekaligus ${place}`,
    ["dorm_manager"],
  );
  const activityId = await addTestActivity(own.db, bam.id);
  const countId = await addTestCount(own.db, {
    activityId,
    day: "3070-10-13",
    byId: bam.id,
    marks: { [resident.studentId]: { isAbsent: true, note: "" } },
  });
  const id = await addTestClarification(own.db, bam.id, {
    countId,
    studentId: resident.studentId,
    status,
  });
  return { id, bam, ki, manager };
}

describe("two decisions on one dorm clarification at the same moment", () => {
  it("keeps the check of BAM that came first: the second waits, then is refused with a message", async () => {
    const { id, bam, ki } = await clarificationOf(0, "submitted");

    const both = await own.atOnce(
      (db) =>
        decideDormClarification(db, bam, "verify", {
          id,
          kind: "pass",
          note: "",
        }),
      (db) =>
        decideDormClarification(db, ki, "verify", {
          id,
          kind: "reject",
          note: "Tidak sah.",
        }),
    );

    expect(both.sooner).toEqual({ ok: true, value: "verified" });
    expect(both.later).toEqual(DECIDED_FIRST);
    expect(await clarificationById(own.db, id)).toMatchObject({
      status: "verified",
      verifiedBy: bam.id,
    });
    expect(await changesOf(own.db, id)).toHaveLength(1);
  });

  it("keeps the decision of Pengelola Asrama that came first, and refuses the second", async () => {
    const { id, manager } = await clarificationOf(1, "verified");

    const both = await own.atOnce(
      (db) =>
        decideDormClarification(db, manager, "decide", {
          id,
          kind: "present",
          note: "",
        }),
      (db) =>
        decideDormClarification(db, manager, "decide", {
          id,
          kind: "reject",
          note: "Tidak sah.",
        }),
    );

    expect(both.sooner).toEqual({ ok: true, value: "accepted" });
    expect(both.later).toEqual(DECIDED_FIRST);
    expect(await clarificationById(own.db, id)).toMatchObject({
      status: "accepted",
      acceptedAs: "present",
    });
    expect(await changesOf(own.db, id)).toHaveLength(1);
  });
});
