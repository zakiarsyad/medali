// Sample NIMs of this file: 9982120000 to 9982120099.

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { dormViolationAppeals } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { ALREADY_APPEALED, APPEAL_SENT } from "./appeal-messages";
import { sendViolationAppeal } from "./send-appeal";
import {
  addTestViolation,
  addViolationActor,
  addViolationSetting,
  linesOf,
  type ViolationSetting,
} from "./test-violations";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("advokasiasrama");

const DAY = "2026-10-12";
// 21:30 on campus on the day, half an hour after the announcement.
const MOMENT = new Date("2026-10-12T14:30:00Z");
const REASON = "Saya sedang izin resmi pulang pada jam tersebut.";

let setting: ViolationSetting | undefined;

/** The residents, once for the file: angkatan 2026 lives in the dorm then. */
async function residents(): Promise<ViolationSetting> {
  setting ??= await addViolationSetting(
    own.db,
    2026,
    "Prodi Uji Advokasi Sekaligus",
    ["9982120001", "9982120002", "9982120003", "9982120004", "9982120005"],
  );
  return setting;
}

describe("Kirim advokasi pressed twice at the same moment", () => {
  it("keeps one appeal: the second waits, then is told the violation has one", async () => {
    const { residents: ids } = await residents();
    const ani = ids[0] ?? "";
    const bam = await addViolationActor(own.db, "BAM Uji Advokasi Dua", [
      "bam_bphk",
    ]);
    const resident = await addViolationActor(own.db, "Ani", ["student"], ani);
    const violationId = await addTestViolation(own.db, ani, bam.id, DAY);
    const sent = { violationId, reason: REASON, file: null };

    const both = await own.atOnce(
      (db) => sendViolationAppeal(db, null, resident, sent, MOMENT),
      (db) => sendViolationAppeal(db, null, resident, sent, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: APPEAL_SENT });
    expect(both.later).toEqual(ALREADY_APPEALED);
    const kept = await own.db
      .select()
      .from(dormViolationAppeals)
      .where(eq(dormViolationAppeals.violationId, violationId));
    expect(kept).toHaveLength(1);
    const lines = await linesOf(own.db, violationId);
    expect(lines.map((line) => line.action)).toEqual(["appealed"]);
  });
});
