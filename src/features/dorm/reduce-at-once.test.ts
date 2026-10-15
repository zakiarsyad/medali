// Sample NIMs of this file: 9986113000 to 9986113099.

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { dormViolations } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { reduceViolations } from "./reduce-violations";
import { ALREADY_REDUCED } from "./reduction-messages";
import {
  addViolationActor,
  addViolationSetting,
  linesOf,
} from "./test-violations";
import { addTestViolations } from "./test-warnings";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("pengurangan");

// 10:00 on campus on 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

describe("Kurangi pressed twice at the same moment", () => {
  it("reduces the violation once with one line in the log: the second waits, then is told it is reduced", async () => {
    const setting = await addViolationSetting(
      own.db,
      2026,
      "Prodi Uji Kurangi Sekaligus",
      ["9986113001", "9986113002", "9986113003", "9986113004", "9986113005"],
    );
    const ani = setting.residents[0] ?? "";
    const bam = await addViolationActor(own.db, "BAM Uji Kurangi", [
      "bam_bphk",
    ]);
    const manager = await addViolationActor(own.db, "Pengelola Uji Kurangi", [
      "dorm_manager",
    ]);
    const [first = ""] = await addTestViolations(
      own.db,
      ani,
      bam.id,
      1,
      "2026-10-01",
    );
    const sent = {
      studentId: ani,
      violationIds: [first],
      reason: "Terbukti sedang izin resmi pada jam itu.",
    };

    const both = await own.atOnce(
      (db) => reduceViolations(db, manager, sent, NOW),
      (db) => reduceViolations(db, manager, sent, NOW),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toEqual(ALREADY_REDUCED);
    const kept = await own.db
      .select({ reducedAt: dormViolations.reducedAt })
      .from(dormViolations)
      .where(eq(dormViolations.id, first));
    expect(kept).toEqual([{ reducedAt: NOW }]);
    const lines = await linesOf(own.db, first);
    expect(lines.map((line) => line.action)).toEqual(["reduced"]);
  });
});
