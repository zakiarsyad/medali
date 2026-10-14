// Sample NIMs of this file: 9964000900 to 9964000999.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ACTIVE, NOT_VISIBLE, UNKNOWN_NIM } from "./siku-file";
import { checkSikuFile, previewSikuFile } from "./siku-file-check";
import { NOT_ALLOWED_TO_ADJUST } from "./siku-messages";
import { addTestActor, addTestStudents } from "./test-siku";

const inTestDatabase = withTestDatabase();

const TITLES = "nim,jenis,alasan,poin,keterangan";

function csv(...lines: string[]) {
  return {
    name: "siku.csv",
    bytes: new TextEncoder().encode(lines.join("\n")),
  };
}

async function addRecords(db: Database) {
  const first = await addTestStudents(db, "Prodi Uji Berkas SIKU A", 2026, [
    "9964000901",
    "9964000902",
    "9964000903",
  ]);
  const second = await addTestStudents(db, "Prodi Uji Berkas SIKU B", 2026, [
    "9964000904",
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

describe("checkSikuFile", () => {
  it("looks the students up: unknown, removed, not Aktif and not seen are skipped", async () => {
    await inTestDatabase(async (db) => {
      const { first, ani } = await addRecords(db);
      const ownProgram = visibleTo({
        kind: "some",
        studyProgramIds: [first.programId],
        menteesOf: [],
        studentIds: [],
      });

      const checked = await checkSikuFile(
        db,
        ownProgram,
        csv(
          TITLES,
          "9964000901,tambah,1,2,Konten",
          "9964000902,tambah,1,2,",
          "9964000903,tambah,1,2,",
          "9964000904,tambah,1,2,",
          "9964000999,tambah,1,2,",
        ),
      );

      expect(checked).toEqual({
        ok: true,
        value: {
          ready: [
            {
              row: 2,
              studentId: ani,
              nim: "9964000901",
              name: "Mahasiswa Uji SIKU 1",
              kind: "gain",
              reason: "social_media_campaign",
              points: 2,
              note: "Konten",
              basis: "",
            },
          ],
          skipped: [
            { row: 3, nim: "9964000902", reason: NOT_ACTIVE },
            { row: 4, nim: "9964000903", reason: UNKNOWN_NIM },
            { row: 5, nim: "9964000904", reason: NOT_VISIBLE },
            { row: 6, nim: "9964000999", reason: UNKNOWN_NIM },
          ],
        },
      });
    });
  });

  it.each([
    [
      "a file that is not CSV",
      { name: "siku.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
      "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
    ],
    [
      "an empty file",
      { name: "siku.csv", bytes: new Uint8Array() },
      "Berkas kosong. Isi berkas sesuai templat, lalu unggah lagi.",
    ],
    [
      "a file larger than 1 MB",
      { name: "siku.csv", bytes: new Uint8Array(1024 * 1024 + 1).fill(65) },
      "Ukuran berkas lebih dari 1 MB. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    ],
    [
      "a file that lacks a column",
      csv("nim,jenis,poin", "9964000901,tambah,2"),
      "Kolom tidak ditemukan: alasan. Samakan judul kolom dengan templat.",
    ],
  ])("refuses %s, with what to do", async (_, file, error) => {
    await inTestDatabase(async (db) => {
      const checked = await checkSikuFile(db, visibleTo({ kind: "all" }), file);

      expect(checked).toEqual({ ok: false, error });
    });
  });
});

describe("previewSikuFile", () => {
  it("shows how many rows are ready, the first of them, and the skipped rows with why", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      const preview = await previewSikuFile(
        db,
        penilai,
        csv(TITLES, "9964000901,kurang,4,5,SK-9", "9964000999,tambah,1,2,"),
      );

      expect(preview).toEqual({
        ok: true,
        value: {
          ready: 1,
          firstRows: [
            {
              row: 2,
              nim: "9964000901",
              name: "Mahasiswa Uji SIKU 1",
              kind: "loss",
              reason: "director_decision",
              points: 5,
              keterangan: "SK-9",
            },
          ],
          skipped: 1,
          firstSkipped: [{ row: 3, nim: "9964000999", reason: UNKNOWN_NIM }],
        },
      });
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["a student", "student"],
  ])("refuses %s, who may not enter SIKU", async (_, role) => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Tanpa Hak Berkas", [role]);

      const preview = await previewSikuFile(
        db,
        actor,
        csv(TITLES, "9964000901,tambah,1,2,"),
      );

      expect(preview).toEqual(NOT_ALLOWED_TO_ADJUST);
    });
  });
});
