// Sample NIMs of this file: 9986150000 to 9986150099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { MAX_FILE_ROWS } from "@/files/csv-file";
import { NOT_ACTIVE, SCORE_NOT_IN_RANGE, UNKNOWN_NIM } from "./assessment-file";
import {
  checkAssessmentFile,
  previewAssessmentFile,
} from "./assessment-file-check";
import { NOT_ALLOWED_TO_ASSESS } from "./assessment-messages";
import { addTestActor, addTestStudents } from "./test-assessments";

const inTestDatabase = withTestDatabase();

const TITLES = "nim,mandiri,empati,disiplin,adaptif,loyal,integritas";
const SILVER = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };

function csv(...lines: string[]) {
  return {
    name: "asesmen.csv",
    bytes: new TextEncoder().encode(lines.join("\n")),
  };
}

async function addRecords(db: Database) {
  const first = await addTestStudents(db, "Prodi Uji Berkas Asesmen A", 2026, [
    "9986150001",
    "9986150002",
    "9986150003",
  ]);
  const second = await addTestStudents(db, "Prodi Uji Berkas Asesmen B", 2026, [
    "9986150004",
  ]);
  const [ani, cuti, hapus] = first.studentIds;
  if (!ani || !cuti || !hapus) throw new Error("Students missing.");
  await db
    .update(students)
    .set({ status: "on_leave" })
    .where(eq(students.id, cuti));
  await db
    .update(students)
    .set({ deletedAt: new Date() })
    .where(eq(students.id, hapus));
  const penilai = await addTestActor(db, "Penilai Uji Berkas", ["assessor"]);
  return { first, second, ani, penilai };
}

describe("checkAssessmentFile", () => {
  it("looks the students up: unknown, removed and not seen count as not in the data, and one not Aktif is skipped", async () => {
    await inTestDatabase(async (db) => {
      const { first, ani } = await addRecords(db);
      const ownProgram = visibleTo({
        kind: "some",
        studyProgramIds: [first.programId],
        menteesOf: [],
        studentIds: [],
      });

      const checked = await checkAssessmentFile(
        db,
        ownProgram,
        csv(
          TITLES,
          "9986150001,80,78,84,72,82,86",
          "9986150002,80,78,84,72,82,86",
          "9986150003,80,78,84,72,82,86",
          "9986150004,80,78,84,72,82,86",
          "9986150099,80,78,84,72,82,86",
          "9986150001,80,78,84,72,82,101",
        ),
      );

      expect(checked).toEqual({
        ok: true,
        value: {
          ready: [
            {
              row: 2,
              studentId: ani,
              nim: "9986150001",
              name: "Mahasiswa Uji Asesmen 1",
              scores: SILVER,
            },
          ],
          skipped: [
            { row: 3, nim: "9986150002", reason: NOT_ACTIVE },
            { row: 4, nim: "9986150003", reason: UNKNOWN_NIM },
            { row: 5, nim: "9986150004", reason: UNKNOWN_NIM },
            { row: 6, nim: "9986150099", reason: UNKNOWN_NIM },
            { row: 7, nim: "9986150001", reason: SCORE_NOT_IN_RANGE },
          ],
          duplicates: 0,
        },
      });
    });
  });

  it.each([
    [
      "a file that is not CSV",
      { name: "asesmen.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
      "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
    ],
    [
      "an empty file",
      { name: "asesmen.csv", bytes: new Uint8Array() },
      "Berkas kosong. Isi berkas sesuai templat, lalu unggah lagi.",
    ],
    [
      "a file larger than 1 MB",
      { name: "asesmen.csv", bytes: new Uint8Array(1024 * 1024 + 1).fill(65) },
      "Ukuran berkas lebih dari 1 MB. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    ],
    [
      "a file that lacks a column",
      csv(
        "nim,mandiri,empati,disiplin,adaptif,loyal",
        "9986150001,80,78,84,72,82",
      ),
      "Kolom tidak ditemukan: integritas. Samakan judul kolom dengan templat.",
    ],
  ])("refuses %s, with what to do", async (_, file, error) => {
    await inTestDatabase(async (db) => {
      const checked = await checkAssessmentFile(
        db,
        visibleTo({ kind: "all" }),
        file,
      );

      expect(checked).toEqual({ ok: false, error });
    });
  });

  it("refuses a file of more than 1,000 rows, with what to do", async () => {
    await inTestDatabase(async (db) => {
      const rows = Array.from(
        { length: MAX_FILE_ROWS + 1 },
        () => "9986150001,80,78,84,72,82,86",
      );

      const checked = await checkAssessmentFile(
        db,
        visibleTo({ kind: "all" }),
        csv(TITLES, ...rows),
      );

      expect(checked).toEqual({
        ok: false,
        error:
          "Berkas berisi 1.001 baris mahasiswa, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
      });
    });
  });

  it("reads a file of 1,000 rows well within 2 seconds", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const rows = Array.from(
        { length: MAX_FILE_ROWS },
        (_, at) => `998615${String(at).padStart(4, "0")},80,78,84,72,82,86`,
      );
      const started = performance.now();

      const checked = await checkAssessmentFile(
        db,
        visibleTo({ kind: "all" }),
        csv(TITLES, ...rows),
      );

      expect(performance.now() - started).toBeLessThan(2000);
      expect(checked.ok && checked.value.ready).toHaveLength(2);
      expect(checked.ok && checked.value.skipped).toHaveLength(
        MAX_FILE_ROWS - 2,
      );
    });
  });
});

describe("previewAssessmentFile", () => {
  it("shows how many rows are ready, the first of them, the NIM ganda and the skipped rows with why", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      const preview = await previewAssessmentFile(
        db,
        penilai,
        csv(
          TITLES,
          "9986150001,70,70,70,70,70,70",
          "9986150001,80,78,84,72,82,86",
          "9986150099,80,78,84,72,82,86",
        ),
      );

      expect(preview).toEqual({
        ok: true,
        value: {
          ready: 1,
          firstRows: [
            {
              row: 3,
              nim: "9986150001",
              name: "Mahasiswa Uji Asesmen 1",
              scores: SILVER,
            },
          ],
          skipped: 1,
          firstSkipped: [{ row: 4, nim: "9986150099", reason: UNKNOWN_NIM }],
          duplicates: 1,
        },
      });
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["a student", "student"],
  ])("refuses %s, who may not enter an assessment", async (_, role) => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Tanpa Hak Berkas", [role]);

      const preview = await previewAssessmentFile(
        db,
        actor,
        csv(TITLES, "9986150001,80,78,84,72,82,86"),
      );

      expect(preview).toEqual(NOT_ALLOWED_TO_ASSESS);
    });
  });
});
