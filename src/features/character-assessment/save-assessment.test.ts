// Sample Tahun akademik of this file: 3260 to 3260.
// Sample NIMs of this file: 9986020000 to 9986020099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { characterAssessments, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestStudent } from "@/dorms/test-records";
import type { SentAssessment } from "./assessment-input";
import {
  ASSESSMENT_ALREADY_SENT,
  INVALID_SCORES,
  NO_PERIOD,
  NOT_ALLOWED_TO_ASSESS,
  NOTE_TOO_LONG,
  STUDENT_NOT_FOUND,
  UNKNOWN_SOURCE,
} from "./assessment-messages";
import { searchAssessmentStudents } from "./assessment-picks";
import { saveAssessment } from "./save-assessment";
import {
  addTestActor,
  addTestPeriod,
  addTestStudents,
} from "./test-assessments";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 3260.
const MOMENT = new Date("3260-10-12T03:00:00Z");
// The day before the period starts.
const BEFORE_PERIOD = new Date("3260-07-31T03:00:00Z");

function sentFor(studentId: string): SentAssessment {
  return {
    studentId,
    scores: { M: "80", E: "78", D: "84", A: "72", L: "82", I: "86" },
    source: "medali_instrument",
    note: "Kenaikan pada Disiplin.",
  };
}

async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 3260);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Simpan Asesmen",
    3260,
    ["9986020001"],
  );
  const [ani] = studentIds;
  if (!ani) throw new Error("Student missing.");
  const penilai = await addTestActor(db, "Penilai Uji Simpan", ["assessor"]);
  return { periodId, programId, ani, penilai };
}

async function keptOf(db: Database, studentId: string) {
  return db
    .select()
    .from(characterAssessments)
    .where(eq(characterAssessments.studentId, studentId));
}

describe("saveAssessment", () => {
  it("keeps the six scores, the source and the note, with who, when and the running period, and gives the student's name", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const saved = await saveAssessment(db, penilai, id, sentFor(ani), MOMENT);

      expect(saved).toEqual({ ok: true, value: "Mahasiswa Uji Asesmen 1" });
      expect(await keptOf(db, ani)).toEqual([
        {
          id,
          studentId: ani,
          scoreM: 80,
          scoreE: 78,
          scoreD: 84,
          scoreA: 72,
          scoreL: 82,
          scoreI: 86,
          source: "medali_instrument",
          note: "Kenaikan pada Disiplin.",
          periodId,
          enteredBy: penilai.id,
          enteredAt: MOMENT,
        },
      ]);
    });
  });

  it("lets Kepala Unit save one too, and keeps the earlier one as history", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Simpan", [
        "head_of_unit",
      ]);

      await saveAssessment(
        db,
        penilai,
        crypto.randomUUID(),
        sentFor(ani),
        MOMENT,
      );
      const again = await saveAssessment(
        db,
        kepala,
        crypto.randomUUID(),
        sentFor(ani),
        MOMENT,
      );

      expect(again.ok).toBe(true);
      expect(await keptOf(db, ani)).toHaveLength(2);
    });
  });

  it.each([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["a student", "student"],
  ] as [string, RoleId][])(
    "refuses %s, who has not the right, and keeps nothing",
    async (_who, role) => {
      await inTestDatabase(async (db) => {
        const { programId, ani } = await addRecords(db);
        const actor = await addTestActor(db, "Akun Uji Tanpa Hak", [role], {
          studyProgramId: programId,
        });

        const saved = await saveAssessment(
          db,
          { ...actor, studentId: role === "student" ? ani : null },
          crypto.randomUUID(),
          sentFor(ani),
          MOMENT,
        );

        expect(saved).toEqual(NOT_ALLOWED_TO_ASSESS);
        expect(await keptOf(db, ani)).toEqual([]);
      });
    },
  );

  it.each([
    ["a score below 40", { D: "39" }, INVALID_SCORES],
    ["a score above 100", { I: "101" }, INVALID_SCORES],
    ["a score that is not whole", { M: "80.5" }, INVALID_SCORES],
  ] as const)(
    "refuses %s and keeps nothing",
    async (_what, scores, refusal) => {
      await inTestDatabase(async (db) => {
        const { ani, penilai } = await addRecords(db);
        const sent = sentFor(ani);

        const saved = await saveAssessment(
          db,
          penilai,
          crypto.randomUUID(),
          { ...sent, scores: { ...sent.scores, ...scores } },
          MOMENT,
        );

        expect(saved).toEqual(refusal);
        expect(await keptOf(db, ani)).toEqual([]);
      });
    },
  );

  it("refuses an unknown source and a note too long", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);

      const source = await saveAssessment(
        db,
        penilai,
        crypto.randomUUID(),
        { ...sentFor(ani), source: "rumor" },
        MOMENT,
      );
      const note = await saveAssessment(
        db,
        penilai,
        crypto.randomUUID(),
        { ...sentFor(ani), note: "a".repeat(501) },
        MOMENT,
      );

      expect(source).toEqual(UNKNOWN_SOURCE);
      expect(note).toEqual(NOTE_TOO_LONG);
      expect(await keptOf(db, ani)).toEqual([]);
    });
  });

  it("refuses a student who is not Aktif, one who was removed, and one who does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, penilai } = await addRecords(db);
      const onLeave = await addTestStudent(db, programId, {
        nim: "9986020009",
        name: "Mahasiswa Uji Simpan Cuti",
        status: "on_leave",
      });
      await db
        .update(students)
        .set({ deletedAt: MOMENT, deletedBy: penilai.id })
        .where(eq(students.id, ani));

      for (const studentId of [onLeave, ani, crypto.randomUUID()]) {
        const saved = await saveAssessment(
          db,
          penilai,
          crypto.randomUUID(),
          sentFor(studentId),
          MOMENT,
        );
        expect(saved).toEqual(STUDENT_NOT_FOUND);
      }
      expect(await keptOf(db, onLeave)).toEqual([]);
      expect(await keptOf(db, ani)).toEqual([]);
    });
  });

  it("refuses while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);

      const saved = await saveAssessment(
        db,
        penilai,
        crypto.randomUUID(),
        sentFor(ani),
        BEFORE_PERIOD,
      );

      expect(saved).toEqual(NO_PERIOD);
      expect(await keptOf(db, ani)).toEqual([]);
    });
  });

  it("keeps a form sent twice once, answering the second as the first, and refuses the same key with other scores", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const sent = sentFor(ani);

      const first = await saveAssessment(db, penilai, id, sent, MOMENT);
      const second = await saveAssessment(db, penilai, id, sent, MOMENT);
      const changed = await saveAssessment(
        db,
        penilai,
        id,
        { ...sent, scores: { ...sent.scores, M: "90" } },
        MOMENT,
      );

      expect(second).toEqual(first);
      expect(changed).toEqual(ASSESSMENT_ALREADY_SENT);
      expect(await keptOf(db, ani)).toHaveLength(1);
    });
  });

  it("writes a line in the log that cannot be edited: the saved assessment refuses any change", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      await saveAssessment(db, penilai, id, sentFor(ani), MOMENT);

      const change = db.transaction((tx) =>
        tx
          .update(characterAssessments)
          .set({ scoreM: 40 })
          .where(eq(characterAssessments.id, id)),
      );

      await expect(change).rejects.toThrow();
      const [kept] = await keptOf(db, ani);
      expect(kept).toMatchObject({ scoreM: 80, enteredBy: penilai.id });
    });
  });
});

describe("searchAssessmentStudents", () => {
  it("offers the Aktif students found, with the scores of their latest assessment", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, penilai } = await addRecords(db);
      await addTestStudent(db, programId, {
        nim: "9986020008",
        name: "Mahasiswa Uji Asesmen Cuti",
        status: "on_leave",
      });
      await saveAssessment(
        db,
        penilai,
        crypto.randomUUID(),
        sentFor(ani),
        MOMENT,
      );

      const found = await searchAssessmentStudents(db, penilai, "99860200");

      expect(found).toEqual([
        {
          id: ani,
          name: "Mahasiswa Uji Asesmen 1",
          nim: "9986020001",
          program: "Prodi Uji Simpan Asesmen",
          latest: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
        },
      ]);
    });
  });

  it("finds nothing for an empty text, or for an account without the right", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const pengasuh = await addTestActor(db, "Pengasuh Uji Cari", ["mentor"]);

      expect(await searchAssessmentStudents(db, penilai, "")).toEqual([]);
      expect(await searchAssessmentStudents(db, pengasuh, "99860200")).toEqual(
        [],
      );
    });
  });
});
