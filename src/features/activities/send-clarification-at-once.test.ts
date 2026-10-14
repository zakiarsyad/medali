import { afterEach, describe, expect, it } from "vitest";
import { testPaper } from "@/clarifications/test-paper";
import {
  academicPeriods,
  accounts,
  activityClarifications,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { sendClarification } from "./send-clarification";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "./test-records";

/*
 * Two sends at the same moment need two connections that both see the
 * saved rows, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("kirimklar");

afterEach(async () => {
  await own.db.delete(activityClarifications);
  await own.db.delete(activitySchedules);
  await own.db.delete(ppksActivities);
  await own.db.delete(academicPeriods);
  await own.db.delete(accounts);
  await own.db.delete(students);
});

describe("Kirim klarifikasi pressed twice at the same moment", () => {
  it("keeps one clarification and one file: the second press waits for the first, then finds it sent", async () => {
    const staff = await addTestActor(own.db, "Penilai Dua Kali Klar", [
      "assessor",
    ]);
    const activityId = await addTestActivity(own.db, staff.id);
    const periods = await addTestPeriods(own.db, 2310);
    const programId = await addTestProgram(own.db, "UJIKLARDUAKALI");
    const student = await addTestStudentAccount(own.db, programId, {
      nim: "9973800001",
      name: "Mahasiswa Dua Kali Klar",
      cohortYear: 2309,
    });
    const scheduleId = await addTestSchedule(own.db, {
      activityId,
      academicPeriodId: periods.oddId,
      changedBy: staff.id,
      startsOn: "2310-10-13",
    });
    const store = memoryStore();
    // Two days after the last upload day: the student sent nothing.
    const at = new Date("2310-10-16T03:00:00Z");
    const sent = {
      scheduleId,
      reason: "sick",
      explanation: "Demam sejak malam sebelum kegiatan.",
      file: { name: "surat-keterangan.pdf", bytes: testPaper() },
    };

    const both = await own.atOnce(
      (db) => sendClarification(db, store, student, sent, at),
      (db) => sendClarification(db, store, student, sent, at),
    );

    const answer = { ok: true, value: "Klarifikasi terkirim." };
    expect(both.sooner).toEqual(answer);
    expect(both.later).toEqual(answer);
    const kept = await own.db.select().from(activityClarifications);
    expect(kept).toHaveLength(1);
    expect([...store.files.keys()]).toEqual([kept[0]?.fileKey]);
  });
});
