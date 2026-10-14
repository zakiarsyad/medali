// Sample Tahun akademik of this file: 2320 to 2320.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { activityClarifications, activitySchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type MemoryStore,
  memoryStore,
  unreachableStore,
} from "@/files/memory-store";
import { openClarificationFile } from "./open-clarification-file";
import { sendClarification } from "./send-clarification";
import { testPaper } from "./test-paper";
import {
  addTestActivity,
  addTestActor,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2320, the program
 * UJIBUKAKLAR and the NIMs 9973900000 to 9973900099.
 */

const inTestDatabase = withTestDatabase();

/** Two days after the last upload day of the schedule. */
const WHILE_OPEN = new Date("2320-10-16T03:00:00Z");
const PAPER = { name: "surat dokter.pdf", bytes: testPaper(80) };
const NOT_FOUND = { ok: false, refusal: "not-found" };

interface Records {
  assessorId: string;
  programId: number;
  store: MemoryStore;
  scheduleId: string;
  /** The student who sent the clarification. */
  student: TestStudentAccount;
  /** The clarification the file belongs to. */
  clarificationId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const assessor = await addTestActor(db, "Penilai Uji Buka Klar", [
    "assessor",
  ]);
  const activityId = await addTestActivity(db, assessor.id);
  const periods = await addTestPeriods(db, 2320);
  const programId = await addTestProgram(db, "UJIBUKAKLAR");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9973900001",
    name: "Mahasiswa Uji Buka Klar",
    cohortYear: 2319,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: assessor.id,
    startsOn: "2320-10-13",
  });
  const store = memoryStore();
  const sent = {
    scheduleId,
    reason: "sick",
    explanation: "Demam sejak malam sebelum kegiatan.",
    file: PAPER,
  };
  await sendClarification(db, store, student, sent, WHILE_OPEN);
  const [clarification] = await db.select().from(activityClarifications);
  if (!clarification) throw new Error("The clarification was not sent.");
  return {
    assessorId: assessor.id,
    programId,
    store,
    scheduleId,
    student,
    clarificationId: clarification.id,
  };
}

function staffWith<Roles extends readonly string[]>(id: string, roles: Roles) {
  return { id, roles, studyProgramId: null, studentId: null };
}

describe("openClarificationFile", () => {
  it("gives the student the file they sent, unchanged and under its own name", async () => {
    await inTestDatabase(async (db) => {
      const { store, student, clarificationId } = await addRecords(db);

      const opened = await openClarificationFile(
        db,
        store,
        student,
        clarificationId,
      );

      expect(opened).toEqual({
        ok: true,
        file: {
          name: "surat dokter.pdf",
          contentType: "application/pdf",
          bytes: PAPER.bytes,
        },
      });
    });
  });

  it("refuses a visitor who is not signed in", async () => {
    await inTestDatabase(async (db) => {
      const { store, clarificationId } = await addRecords(db);

      expect(
        await openClarificationFile(db, store, null, clarificationId),
      ).toEqual({ ok: false, refusal: "not-signed-in" });
    });
  });

  it("gives Penilai Mahasiswa the file of any student, to decide the clarification", async () => {
    await inTestDatabase(async (db) => {
      const { store, assessorId, clarificationId } = await addRecords(db);
      const assessor = staffWith(assessorId, ["assessor"] as const);

      const opened = await openClarificationFile(
        db,
        store,
        assessor,
        clarificationId,
      );

      expect(opened).toMatchObject({ ok: true, file: { bytes: PAPER.bytes } });
    });
  });

  it.each([
    ["Kepala Unit", ["head_of_unit"]],
    ["Pegawai UPK", ["upk_staff"]],
    ["Direktur", ["director"]],
    ["Ketua Program Studi", ["head_of_program"]],
    ["Pengasuh", ["mentor"]],
    ["BAM - BPHK", ["bam_bphk"]],
  ] as const)(
    "refuses %s, who reads the clarification but not its file, even with the exact address and the student's own record",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const { store, student, clarificationId } = await addRecords(db);

        const opened = await openClarificationFile(
          db,
          store,
          { ...student, roles },
          clarificationId,
        );

        expect(opened).toEqual({ ok: false, refusal: "not-allowed" });
      });
    },
  );

  it("refuses another student, as if the file did not exist", async () => {
    await inTestDatabase(async (db) => {
      const { store, programId, clarificationId } = await addRecords(db);
      const other = await addTestStudentAccount(db, programId, {
        nim: "9973900002",
        name: "Mahasiswa Uji Lain Klar",
        cohortYear: 2319,
      });

      const opened = await openClarificationFile(
        db,
        store,
        other,
        clarificationId,
      );

      expect(opened).toEqual(NOT_FOUND);
    });
  });

  it("does not open the file of a removed schedule, for the student or for Penilai Mahasiswa", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { store, student, assessorId, clarificationId } = records;
      await db
        .update(activitySchedules)
        .set({ deletedAt: WHILE_OPEN, deletedBy: assessorId })
        .where(eq(activitySchedules.id, records.scheduleId));
      const assessor = staffWith(assessorId, ["assessor"] as const);

      expect(
        await openClarificationFile(db, store, student, clarificationId),
      ).toEqual(NOT_FOUND);
      expect(
        await openClarificationFile(db, store, assessor, clarificationId),
      ).toEqual(NOT_FOUND);
      expect(await db.select().from(activityClarifications)).toHaveLength(1);
    });
  });

  it("finds nothing for an unknown or malformed key, for a clarification without a file, and where file keeping is off", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { store, student, assessorId, clarificationId } = records;
      const noFile = await addTestClarification(db, assessorId, {
        scheduleId: records.scheduleId,
        studentId: student.studentId,
        status: "rejected",
      });
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const id of [unknown, "bukan-kunci", "", noFile]) {
        expect(await openClarificationFile(db, store, student, id)).toEqual(
          NOT_FOUND,
        );
      }
      expect(
        await openClarificationFile(db, null, student, clarificationId),
      ).toEqual(NOT_FOUND);
    });
  });

  it("finds nothing when the file is no longer in the file storage", async () => {
    await inTestDatabase(async (db) => {
      const { student, clarificationId } = await addRecords(db);

      const opened = await openClarificationFile(
        db,
        memoryStore(),
        student,
        clarificationId,
      );

      expect(opened).toEqual(NOT_FOUND);
    });
  });

  it("says to try again when the file storage cannot be reached", async () => {
    await inTestDatabase(async (db) => {
      const { student, clarificationId } = await addRecords(db);

      const opened = await openClarificationFile(
        db,
        unreachableStore(),
        student,
        clarificationId,
      );

      expect(opened).toEqual({ ok: false, refusal: "unreachable" });
    });
  });
});
