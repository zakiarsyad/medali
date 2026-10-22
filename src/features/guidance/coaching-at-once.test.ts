// Sample Tahun akademik of this file: 4473 to 4473.
// Sample NIMs of this file: 9987703000 to 9987703099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { changeCoachingStatus } from "./change-coaching-status";
import { COACHING_OUTDATED } from "./coaching-messages";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  coachingLinesOf,
  coachingStatusAt,
  INTENSIVE,
} from "./test-coaching";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

/*
 * Two changes at the same moment need two connections that both see the
 * saved rows. So this check has a database of its own, dropped at the
 * end.
 */
const own = withOwnTestDatabase("pembinaankarakter");

describe("one coaching status changed by two people at the same moment", () => {
  it("keeps the first: the second waits, then is refused with the current status, and the log has one line", async () => {
    const periodId = await addCoachingPeriod(own.db, 4473);
    const { studentIds } = await addNoteStudents(
      own.db,
      "Prodi Uji Pembinaan Sekaligus",
      "Mahasiswa Uji Pembinaan Sekaligus",
      ["9987703001"],
    );
    const studentId = studentIds[0] ?? "";
    const kepala = await addNoteActor(own.db, "Kepala Uji Sekaligus", [
      "head_of_unit",
    ]);
    const pengasuh = await addNoteActor(own.db, "Kepala Uji Sekaligus Dua", [
      "head_of_unit",
    ]);
    await addCoachingAssessment(
      own.db,
      studentId,
      kepala.id,
      periodId,
      INTENSIVE,
      new Date("4473-09-01T03:00:00Z"),
    );

    const both = await own.atOnce(
      (db) =>
        changeCoachingStatus(db, kepala, studentId, 0, "counselling", "Satu."),
      (db) => changeCoachingStatus(db, pengasuh, studentId, 0, "done", "Dua."),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: {
        name: "Mahasiswa Uji Pembinaan Sekaligus 1",
        status: "counselling",
        note: "Satu.",
        version: 1,
      },
    });
    expect(both.later).toEqual({
      ...COACHING_OUTDATED,
      current: { status: "counselling", note: "Satu.", version: 1 },
    });
    expect(await coachingStatusAt(own.db, studentId)).toMatchObject({
      status: "counselling",
      note: "Satu.",
      version: 1,
      changedBy: kepala.id,
    });
    const lines = await coachingLinesOf(own.db, studentId);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      statusBefore: "identified",
      statusAfter: "counselling",
      changedBy: kepala.id,
    });
  });
});
