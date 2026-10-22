// Sample NIMs of this file: 9986685000 to 9986685099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addTestPenalty } from "@/features/guidance/test-discipline-penalties";
import { ALREADY_ASSIGNED, assignedTo } from "./penalty-assignment-words";
import { assignFromPenalty } from "./penalty-assignments";
import { addTestActor, addTestPeople } from "./test-consents";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("penaltyassign");

const NOW = new Date("2026-10-19T03:00:00Z");

describe("Tugaskan konseling pressed twice, or by two people, at the same moment", () => {
  it("makes one Penugasan with one log line: the second waits, then is told Sudah ditugaskan.", async () => {
    const people = await addTestPeople(own.db, "Prodi Uji Tugaskan Sekaligus", [
      "9986685001",
    ]);
    const [studentId] = people.studentIds;
    if (!studentId) throw new Error("Student missing.");
    const pembina = await addTestActor(own.db, "Pembina Uji Sekaligus", [
      "discipline_officer",
    ]);
    const pembinaLain = await addTestActor(own.db, "Pembina Uji Sekaligus 2", [
      "discipline_officer",
    ]);
    const penaltyId = await addTestPenalty(
      own.db,
      studentId,
      pembina.id,
      "2026-10-15",
    );

    const both = await own.atOnce(
      (db) => assignFromPenalty(db, pembina, penaltyId, "", NOW),
      (db) => assignFromPenalty(db, pembinaLain, penaltyId, "", NOW),
    );

    expect(both.sooner).toEqual({
      kind: "kept",
      done: assignedTo("Mahasiswa Uji Konseling 1"),
    });
    expect(both.later).toEqual({ kind: "refused", error: ALREADY_ASSIGNED });
    const kept = await own.db
      .select()
      .from(counsellingSchedules)
      .where(eq(counsellingSchedules.penaltyId, penaltyId));
    expect(kept).toHaveLength(1);
    const lines = await own.db
      .select()
      .from(counsellingScheduleChanges)
      .where(eq(counsellingScheduleChanges.scheduleId, kept[0]?.id ?? ""));
    expect(lines).toHaveLength(1);
  });
});
