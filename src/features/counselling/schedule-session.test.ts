// Sample NIMs of this file: 9986213000 to 9986213099.
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnConsent } from "./change-consent";
import { readScheduleSession } from "./schedule-session";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestSchedule } from "./test-schedules";
import {
  addConsentedPeople,
  CONSENTED_AT,
  TEST_SESSION,
} from "./test-sessions";
import { writeSession } from "./write-session";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Selasa 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

async function doneSchedule(
  db: Database,
  nim: string,
  options: { consented?: boolean; status?: "done" | "scheduled" } = {},
) {
  const add = options.consented === false ? addTestPeople : addConsentedPeople;
  const people = await add(db, `Prodi Uji Sesi Selesai ${nim}`, [nim]);
  const [student] = people.students;
  if (!student?.studentId) throw new Error("Student missing.");
  const scheduleId = await addTestSchedule(db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    status: options.status ?? "done",
    day: "2026-10-19",
    counsellorId: people.counsellor.id,
  });
  return { ...people, student, studentId: student.studentId, scheduleId };
}

describe("the session a schedule marked Selesai opens", () => {
  it("is for its student, on its day, with the Jenis of its Cara, while the consent is Disetujui", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId, scheduleId } = await doneSchedule(
        db,
        "9986213001",
      );

      expect(await readScheduleSession(db, counsellor, scheduleId)).toEqual({
        kind: "open",
        start: {
          scheduleId,
          studentId,
          name: "Mahasiswa Uji Konseling 1",
          day: "2026-10-19",
          kind: "individual_in_person",
        },
      });
    });
  });

  it("is not opened, saying the consent is needed, while it is not Disetujui", async () => {
    await inTestDatabase(async (db) => {
      const never = await doneSchedule(db, "9986213002", { consented: false });
      const withdrawn = await doneSchedule(db, "9986213003");
      await changeOwnConsent(
        db,
        withdrawn.student,
        "withdraw",
        CONSENTED_AT.toISOString(),
        NOW,
      );

      for (const { counsellor, scheduleId } of [never, withdrawn]) {
        expect(await readScheduleSession(db, counsellor, scheduleId)).toEqual({
          kind: "needs_consent",
        });
      }
    });
  });

  it("is not opened once the schedule has its session", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId, scheduleId } = await doneSchedule(
        db,
        "9986213004",
      );
      const press = { id: randomUUID(), studentId, scheduleId };
      await writeSession(db, counsellor, press, TEST_SESSION, NOW);

      expect(await readScheduleSession(db, counsellor, scheduleId)).toEqual({
        kind: "none",
      });
    });
  });

  it("is not opened for a schedule not Selesai, or not found", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, scheduleId } = await doneSchedule(db, "9986213005", {
        status: "scheduled",
      });

      for (const id of [scheduleId, randomUUID(), "bukan-id", 7]) {
        expect(await readScheduleSession(db, counsellor, id)).toEqual({
          kind: "none",
        });
      }
    });
  });

  it("is not opened for any role but Konselor", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await doneSchedule(db, "9986213006");
      const head = await addTestActor(db, "Kepala Unit Uji", ["head_of_unit"]);

      for (const actor of [student, head]) {
        expect(await readScheduleSession(db, actor, scheduleId)).toEqual({
          kind: "none",
        });
      }
    });
  });
});
