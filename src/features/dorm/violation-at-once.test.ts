// Sample NIMs of this file: 9982030000 to 9982030099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { cancelViolation } from "./cancel-violation";
import { saveViolations } from "./save-violations";
import {
  addViolationActor,
  addViolationSetting,
  linesOf,
  sentList,
  sentRow,
  type ViolationSetting,
  violationsUnder,
} from "./test-violations";
import { ALREADY_CANCELLED } from "./violation-messages";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("pelanggaranasrama");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");
const TODAY = "2026-10-12";

let setting: ViolationSetting | undefined;

/** The residents, once for the file: angkatan 2026 lives in the dorm then. */
async function residents(): Promise<ViolationSetting> {
  setting ??= await addViolationSetting(
    own.db,
    2026,
    "Prodi Uji Pelanggaran Sekaligus",
    ["9982030001", "9982030002", "9982030003", "9982030004", "9982030005"],
  );
  return setting;
}

describe("Simpan dan jadwalkan publikasi pressed twice at the same moment", () => {
  it("keeps the list once: the second waits, then answers the same", async () => {
    const { residents: ids } = await residents();
    const actor = await addViolationActor(own.db, "BAM Uji Sekaligus", [
      "bam_bphk",
    ]);
    const key = crypto.randomUUID();
    const list = sentList(TODAY, [
      sentRow(ids[0] ?? ""),
      sentRow(ids[1] ?? ""),
    ]);

    const both = await own.atOnce(
      (db) => saveViolations(db, actor, key, list, MOMENT),
      (db) => saveViolations(db, actor, key, list, MOMENT),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(both.sooner);
    const kept = await violationsUnder(own.db, key);
    expect(kept).toHaveLength(2);
    for (const row of kept) {
      expect(await linesOf(own.db, row.id)).toHaveLength(1);
    }
  });
});

describe("two cancels of one violation at the same moment", () => {
  it("lets the first win whole: the second waits, then is refused, and the log has one cancel", async () => {
    const { residents: ids } = await residents();
    const recorder = await addViolationActor(own.db, "BAM Uji Batal A", [
      "bam_bphk",
    ]);
    const other = await addViolationActor(own.db, "BAM Uji Batal B", [
      "bam_compliance",
    ]);
    const key = crypto.randomUUID();
    const list = sentList(TODAY, [sentRow(ids[2] ?? "")]);
    const saved = await saveViolations(own.db, recorder, key, list, MOMENT);
    if (!saved.ok) throw new Error(saved.error);
    const [violation] = await violationsUnder(own.db, key);
    const id = violation?.id ?? "";

    const both = await own.atOnce(
      (db) => cancelViolation(db, recorder, id, MOMENT),
      (db) => cancelViolation(db, other, id, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(ALREADY_CANCELLED);
    const [kept] = await violationsUnder(own.db, key);
    expect(kept?.cancelledBy).toBe(recorder.id);
    const lines = await linesOf(own.db, id);
    expect(lines.map((line) => line.action)).toEqual(["entered", "cancelled"]);
  });
});
