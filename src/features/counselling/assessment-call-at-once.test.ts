// Sample Tahun akademik of this file: 4432 to 4432.
// Sample NIMs of this file: 9986083000 to 9986083099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { ALREADY_CALLED, callSent } from "./assessment-call-words";
import { callFromAssessment } from "./assessment-calls";
import {
  addTestCallAssessment,
  addTestCallPeriod,
  INTENSIVE_SCORES,
} from "./test-assessment-calls";
import { addTestActor, addTestPeople } from "./test-consents";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("assessmentcall");

const NOW = new Date("4432-09-14T03:00:00Z");

describe("Panggil konseling pressed twice, or by two people, at the same moment", () => {
  it("makes one call with one log line: the second waits, then is told Sudah ditugaskan.", async () => {
    const period = await addTestCallPeriod(own.db, 4432, "odd");
    const people = await addTestPeople(own.db, "Prodi Uji Panggil Sekaligus", [
      "9986083001",
    ]);
    const [studentId] = people.studentIds;
    if (!studentId) throw new Error("Student missing.");
    const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
      "assessor",
    ]);
    const penilaiLain = await addTestActor(own.db, "Penilai Uji Sekaligus 2", [
      "assessor",
    ]);
    await addTestCallAssessment(own.db, penilai, {
      studentId,
      periodId: period,
      scores: INTENSIVE_SCORES,
      enteredAt: new Date("4432-09-01T03:00:00Z"),
    });

    const both = await own.atOnce(
      (db) => callFromAssessment(db, penilai, studentId, NOW),
      (db) => callFromAssessment(db, penilaiLain, studentId, NOW),
    );

    expect(both.sooner).toEqual({
      kind: "kept",
      done: callSent("Mahasiswa Uji Konseling 1"),
    });
    expect(both.later).toEqual({ kind: "refused", error: ALREADY_CALLED });
    const kept = await own.db
      .select()
      .from(counsellingSchedules)
      .where(eq(counsellingSchedules.studentId, studentId));
    expect(kept).toHaveLength(1);
    const lines = await own.db
      .select()
      .from(counsellingScheduleChanges)
      .where(eq(counsellingScheduleChanges.scheduleId, kept[0]?.id ?? ""));
    expect(lines).toHaveLength(1);
  });
});
