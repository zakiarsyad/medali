// Sample NIMs of this file: 9982030000 to 9982030099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
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
