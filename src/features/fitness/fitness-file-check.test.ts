// Sample NIMs of this file: 9986200600 to 9986200699.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { fitnessScores, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { MAX_FILE_ROWS } from "@/files/csv-file";
import { NOT_ACTIVE, SCORE_NOT_IN_RANGE, UNKNOWN_NIM } from "./fitness-file";
import { checkFitnessFile, previewFitnessFile } from "./fitness-file-check";
import { NOT_ALLOWED_TO_ENTER } from "./save-fitness-scores";
import { addTestActor, addTestStudents } from "./test-fitness";

const inTestDatabase = withTestDatabase();

function csv(...lines: string[]) {
  return {
    name: "kebugaran.csv",
    bytes: new TextEncoder().encode(lines.join("\n")),
  };
}

async function addRecords(db: Database) {
  const first = await addTestStudents(db, "Prodi Uji Berkas Jasmani A", [
    "9986200601",
    "9986200602",
    "9986200603",
  ]);
  const second = await addTestStudents(db, "Prodi Uji Berkas Jasmani B", [
    "9986200604",
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
  const penilai = await addTestActor(db, "Penilai Uji Berkas Jasmani", [
    "assessor",
  ]);
  return { first, second, ani, penilai };
}

describe("checkFitnessFile", () => {
  it("looks the students up: unknown, removed and not seen count as not in the data, and one not Aktif is skipped", async () => {
    await inTestDatabase(async (db) => {
      const { first, ani } = await addRecords(db);
      const ownProgram = visibleTo({
        kind: "some",
        studyProgramIds: [first.programId],
        menteesOf: [],
        studentIds: [],
      });

      const checked = await checkFitnessFile(
        db,
        ownProgram,
        csv(
          "nim,skor",
          "9986200601,80",
          "9986200602,80",
          "9986200603,80",
          "9986200604,80",
          "9986200699,80",
          "9986200601,80.5",
        ),
      );

      expect(checked).toEqual({
        ok: true,
        value: {
          ready: [
            {
              row: 2,
              studentId: ani,
              nim: "9986200601",
              name: "Mahasiswa Uji Jasmani 1",
              score: 80,
            },
          ],
          skipped: [
            { row: 3, nim: "9986200602", reason: NOT_ACTIVE },
            { row: 4, nim: "9986200603", reason: UNKNOWN_NIM },
            { row: 5, nim: "9986200604", reason: UNKNOWN_NIM },
            { row: 6, nim: "9986200699", reason: UNKNOWN_NIM },
            { row: 7, nim: "9986200601", reason: SCORE_NOT_IN_RANGE },
          ],
          duplicates: 0,
        },
      });
    });
  });

  it.each([
    [
      "a file that is not CSV",
      { name: "kebugaran.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
      "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
    ],
    [
      "an empty file",
      { name: "kebugaran.csv", bytes: new Uint8Array() },
      "Berkas kosong. Isi berkas sesuai templat, lalu unggah lagi.",
    ],
    [
      "a file larger than 1 MB",
      { name: "kebugaran.csv", bytes: new Uint8Array(1024 * 1024 + 1) },
      "Ukuran berkas lebih dari 1 MB. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    ],
    [
      "a file without the column skor",
      csv("nim,nama", "9986200601,Ani"),
      "Kolom tidak ditemukan: skor. Samakan judul kolom dengan templat.",
    ],
    [
      "a file of more than 1,000 rows",
      csv(
        "nim,skor",
        ...Array.from({ length: MAX_FILE_ROWS + 1 }, () => "9986200601,80"),
      ),
      "Berkas berisi 1.001 baris mahasiswa, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    ],
  ])("refuses %s, saying what to do", async (_, file, error) => {
    await inTestDatabase(async (db) => {
      expect(
        await checkFitnessFile(db, visibleTo({ kind: "all" }), file),
      ).toEqual({ ok: false, error });
    });
  });
});

describe("previewFitnessFile", () => {
  it("shows the ready rows with the category of the limits in force, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);

      const preview = await previewFitnessFile(
        db,
        penilai,
        csv("nim,skor", "9986200601,60", "9986200601,72", "9986200699,80"),
      );

      expect(preview).toEqual({
        ok: true,
        value: {
          ready: 1,
          firstRows: [
            {
              row: 3,
              nim: "9986200601",
              name: "Mahasiswa Uji Jasmani 1",
              score: 72,
              category: "good",
            },
          ],
          skipped: 1,
          firstSkipped: [{ row: 4, nim: "9986200699", reason: UNKNOWN_NIM }],
          duplicates: 1,
        },
      });
      const kept = await db
        .select()
        .from(fitnessScores)
        .where(eq(fitnessScores.studentId, ani));
      expect(kept).toEqual([]);
    });
  });

  it("reads 1,000 rows and shows them within about 2 seconds", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const rows = Array.from(
        { length: MAX_FILE_ROWS },
        (_, at) => `99862006${String(at % 100).padStart(2, "0")},${at % 101}`,
      );
      const started = performance.now();

      const preview = await previewFitnessFile(
        db,
        penilai,
        csv("nim,skor", ...rows),
      );

      expect(performance.now() - started).toBeLessThan(2000);
      expect(preview.ok).toBe(true);
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["a student", "student"],
  ])("refuses %s", async (_, role) => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const actor = await addTestActor(db, "Tanpa Hak Berkas Jasmani", [role]);

      expect(
        await previewFitnessFile(db, actor, csv("nim,skor", "9986200601,80")),
      ).toEqual(NOT_ALLOWED_TO_ENTER);
    });
  });
});
