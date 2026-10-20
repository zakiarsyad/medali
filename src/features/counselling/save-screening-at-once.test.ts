// Sample NIMs of this file: 9988600400 to 9988600499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mentalHealthScreeningLog, mentalHealthScreenings } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveScreening } from "./save-screening";
import { addTestPeople } from "./test-consents";
import { setTestConsent } from "./test-screenings";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("screening");

// 10:00 on campus on 16 October 2026.
const NOW = new Date("2026-10-16T03:00:00Z");

describe("Simpan asesmen pressed twice at the same moment", () => {
  it("keeps one screening with one log line, and says saved to both", async () => {
    const people = await addTestPeople(own.db, "Prodi Uji Simpan Berdua", [
      "9988600401",
    ]);
    const [studentId = ""] = people.studentIds;
    const { counsellor } = people;
    await setTestConsent(own.db, studentId, counsellor.id, "approved");
    const key = crypto.randomUUID();
    const form = {
      studentId,
      screenedOn: "2026-10-16",
      instrument: "srq20",
      depression: "",
      anxiety: "",
      stress: "",
      srqYes: "7",
      selfHarm: false,
      note: "",
    };

    const both = await own.atOnce(
      (db) => saveScreening(db, counsellor, key, form, NOW),
      (db) => saveScreening(db, counsellor, key, form, NOW),
    );

    expect(both.sooner).toMatchObject({ kind: "kept" });
    expect(both.later).toMatchObject({ kind: "kept" });
    const screenings = await own.db
      .select({ id: mentalHealthScreenings.id })
      .from(mentalHealthScreenings)
      .where(eq(mentalHealthScreenings.studentId, studentId));
    expect(screenings).toEqual([{ id: key }]);
    const lines = await own.db
      .select({ event: mentalHealthScreeningLog.event })
      .from(mentalHealthScreeningLog)
      .where(eq(mentalHealthScreeningLog.studentId, studentId));
    expect(lines).toEqual([{ event: "saved" }]);
  });
});
