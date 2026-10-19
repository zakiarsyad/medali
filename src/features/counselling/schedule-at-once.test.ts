// Sample NIMs of this file: 9986207000 to 9986207099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  counsellingConsentChanges,
  counsellingScheduleChanges,
  counsellingSchedules,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { registerCounselling } from "./register-counselling";
import { REGISTERED, STILL_ACTIVE } from "./schedule-words";
import { addTestPeople } from "./test-consents";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("schedule");

// Selasa 20 October 2026, 10:00 on campus.
const NOW = new Date("2026-10-20T03:00:00Z");

const SENT = {
  topic: "academic",
  day: "2026-10-21",
  hour: "10:00",
  way: "in_person",
  story: null,
  consented: true,
};

describe("Daftar konseling pressed twice at the same moment", () => {
  it("keeps one request and one consent change: the second waits, then is told the first is active", async () => {
    const people = await addTestPeople(own.db, "Prodi Uji Daftar Sekaligus", [
      "9986207001",
    ]);
    const [student] = people.students;
    if (!student) throw new Error("Student missing.");

    const both = await own.atOnce(
      (db) => registerCounselling(db, student, SENT, NOW),
      (db) => registerCounselling(db, student, SENT, NOW),
    );

    expect(both.sooner).toEqual({ kind: "kept", done: REGISTERED });
    expect(both.later).toEqual({ kind: "refused", error: STILL_ACTIVE });
    const kept = await own.db
      .select()
      .from(counsellingSchedules)
      .where(eq(counsellingSchedules.studentId, student.studentId ?? ""));
    expect(kept).toHaveLength(1);
    const lines = await own.db
      .select()
      .from(counsellingScheduleChanges)
      .where(eq(counsellingScheduleChanges.scheduleId, kept[0]?.id ?? ""));
    expect(lines).toHaveLength(1);
    const consentLines = await own.db
      .select()
      .from(counsellingConsentChanges)
      .where(eq(counsellingConsentChanges.changedBy, student.id));
    expect(consentLines).toHaveLength(1);
  });
});
