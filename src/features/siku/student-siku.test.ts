// Sample Tahun akademik of this file: 3080 to 3080.
// Sample NIMs of this file: 9964003000 to 9964003099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readStudentSiku } from "./student-siku";
import {
  addTestActor,
  addTestEntry,
  addTestGroup,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 3080);
  const own = await addTestStudents(db, "Prodi Uji Rincian SIKU", 3080, [
    "9964003001",
    "9964003002",
  ]);
  const other = await addTestStudents(db, "Prodi Uji Rincian SIKU Lain", 3080, [
    "9964003003",
  ]);
  const [ani = "", budi = ""] = own.studentIds;
  const [citra = ""] = other.studentIds;
  const penilai = await addTestActor(db, "Penilai Uji Rincian", ["assessor"]);
  const mentor = await addTestActor(db, "Pengasuh Uji Rincian", ["mentor"]);
  await addTestGroup(
    db,
    { programId: own.programId, year: 3080, number: 1 },
    mentor.id,
    [ani],
  );
  const head = await addTestActor(db, "KP Uji Rincian", ["head_of_program"], {
    studyProgramId: own.programId,
  });
  const entry = { periodId: periods.odd, studentIds: [ani] };
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "gain",
    reason: "peer_mentoring",
    points: 4,
    day: "3080-09-10",
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "discipline_penalty",
    points: 3,
    day: "3080-10-02",
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "student_violation",
    points: 2,
    day: "3080-09-20",
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "gain",
    reason: "knowledge_sharing",
    points: 5,
    day: "3080-10-05",
    cancelled: true,
  });
  return { ani, budi, citra, penilai, mentor, head };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

/** An account of the role that sees Ani: her mentor and her Kaprodi. */
async function readerOf(
  db: Database,
  role: RoleId,
  records: Records,
): Promise<TestActor> {
  if (role === "mentor") return records.mentor;
  if (role === "head_of_program") return records.head;
  return addTestActor(db, `Uji Disiplin ${role}`, [role]);
}

describe("readStudentSiku", () => {
  it("shows a student's gains and losses in force, newest first, without the cancelled one", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const kepala = await addTestActor(db, "KU Uji Rincian", ["head_of_unit"]);

      const answer = await readStudentSiku(db, kepala, ani);

      if (answer.kind !== "shown") throw new Error("The SIKU was refused.");
      expect(answer.siku.totals).toEqual({ gains: 4, losses: 5 });
      expect(
        answer.siku.entries.map((entry) => [entry.day, entry.reason]),
      ).toEqual([
        ["3080-10-02", "discipline_penalty"],
        ["3080-09-20", "student_violation"],
        ["3080-09-10", "peer_mentoring"],
      ]);
    });
  });

  it.each<RoleId>(["head_of_unit", "director", "head_of_program", "mentor"])(
    "shows %s, who may read discipline records, the reason and note of a discipline loss",
    async (role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const reader = await readerOf(db, role, records);

        const answer = await readStudentSiku(db, reader, records.ani);

        if (answer.kind !== "shown") throw new Error("The SIKU was refused.");
        const [discipline] = answer.siku.entries;
        expect(discipline).toMatchObject({
          reason: "discipline_penalty",
          note: "Catatan uji",
        });
      });
    },
  );

  it("withholds from Penilai Mahasiswa the reason and note of a discipline loss, and keeps its date and points", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);

      const answer = await readStudentSiku(db, penilai, ani);

      if (answer.kind !== "shown") throw new Error("The SIKU was refused.");
      const [discipline, violation] = answer.siku.entries;
      expect(discipline).toMatchObject({
        day: "3080-10-02",
        kind: "loss",
        points: 3,
        reason: null,
      });
      expect(discipline).not.toHaveProperty("note");
      expect(discipline).not.toHaveProperty("basis");
      expect(violation?.reason).toBe("student_violation");
      expect(JSON.stringify(answer)).not.toContain("discipline_penalty");
    });
  });

  it("shows Ketua Program Studi a student of their own program, and refuses one of another", async () => {
    await inTestDatabase(async (db) => {
      const { ani, citra, head } = await addRecords(db);

      expect((await readStudentSiku(db, head, ani)).kind).toBe("shown");
      expect(await readStudentSiku(db, head, citra)).toEqual({
        kind: "refused",
      });
    });
  });

  it("shows Pengasuh their own mentee, and refuses a student who is not", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, mentor } = await addRecords(db);

      expect((await readStudentSiku(db, mentor, ani)).kind).toBe("shown");
      expect(await readStudentSiku(db, mentor, budi)).toEqual({
        kind: "refused",
      });
    });
  });

  it("refuses a student who asks for another student's lines, and even their own here", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi } = await addRecords(db);
      const student = await addTestActor(
        db,
        "Mahasiswa Uji Rincian",
        ["student"],
        {
          studentId: budi,
        },
      );

      expect(await readStudentSiku(db, student, ani)).toEqual({
        kind: "refused",
      });
      expect(await readStudentSiku(db, student, budi)).toEqual({
        kind: "refused",
      });
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "shows nothing of a student whose status is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { ani, penilai } = await addRecords(db);
        await db.update(students).set({ status }).where(eq(students.id, ani));

        expect(await readStudentSiku(db, penilai, ani)).toEqual({
          kind: "refused",
        });
      });
    },
  );

  it("answers a text that is no id with a refusal", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      expect(await readStudentSiku(db, penilai, "bukan-id")).toEqual({
        kind: "refused",
      });
    });
  });
});
