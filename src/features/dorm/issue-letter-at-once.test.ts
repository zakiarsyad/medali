// Sample NIMs of this file: 9986105000 to 9986105099.

import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { issueWarningLetter } from "./issue-letter";
import { addViolationActor, addViolationSetting } from "./test-violations";
import { addTestViolations, letterLinesOf, lettersOf } from "./test-warnings";
import { ALREADY_ISSUED, SP1_ISSUED } from "./warning-messages";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("suratperingatan");

// 10:00 on campus on 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

describe("Terbitkan SP pressed twice at the same moment", () => {
  it("keeps one SP with one line in the log: the second waits, then is told it is issued", async () => {
    const setting = await addViolationSetting(
      own.db,
      2026,
      "Prodi Uji SP Sekaligus",
      ["9986105001", "9986105002", "9986105003", "9986105004", "9986105005"],
    );
    const ani = setting.residents[0] ?? "";
    const bam = await addViolationActor(own.db, "BAM Uji SP", ["bam_bphk"]);
    const manager = await addViolationActor(own.db, "Pengelola Uji SP", [
      "dorm_manager",
    ]);
    await addTestViolations(own.db, ani, bam.id, 7, "2026-10-01");
    const sent = {
      studentId: ani,
      level: 1,
      result: "Mahasiswa hadir dan mengakui pelanggarannya.",
      proposalNote: "",
    };

    const both = await own.atOnce(
      (db) => issueWarningLetter(db, manager, sent, NOW),
      (db) => issueWarningLetter(db, manager, sent, NOW),
    );

    expect(both.sooner).toEqual({ ok: true, value: SP1_ISSUED });
    expect(both.later).toEqual(ALREADY_ISSUED);
    const letters = await lettersOf(own.db, ani);
    expect(letters).toHaveLength(1);
    const lines = await letterLinesOf(own.db, letters[0]?.id ?? "");
    expect(lines.map((line) => line.action)).toEqual(["issued"]);
  });
});
