// Sample Tahun akademik of this file: 3229 to 3230.
// Sample NIMs of this file: 9985030000 to 9985030099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  skpmRows,
  skpmUploadChanges,
  skpmUploads,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { fingerprintOf } from "@/files/file-fingerprint";
import { repeatedFile } from "@/ui/repeated-file";
import { removeSkpmUpload } from "./remove-skpm-upload";
import { savedMessage, saveSkpmFile } from "./save-skpm-file";
import { START_PARAMS } from "./skpm-address";
import { readSkpmList } from "./skpm-board";
import { previewSkpmFile } from "./skpm-file-check";
import {
  ALREADY_REMOVED,
  FILE_ALREADY_SENT,
  NO_PERIOD,
  NOT_ALLOWED_TO_UPLOAD,
  NOTHING_TO_SAVE,
  UNKNOWN_MODE,
  UPLOAD_NOT_FOUND,
} from "./skpm-messages";
import { skpmVisibleTo } from "./skpm-readers";
import { readUploadHistory } from "./skpm-uploads";
import {
  addTestActor,
  addTestPeriod,
  addTestStudents,
  addTestUpload,
} from "./test-skpm";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 3230, in the odd period of 3230.
const MOMENT = new Date("3230-10-12T03:00:00Z");
const LATER = new Date("3230-10-14T03:00:00Z");

const TITLES = "nim,kegiatan,kategori,tingkat,peran,tanggal,poin";
const ROWS = [
  TITLES,
  "9985030001,Lomba debat,Lomba atau kompetisi,Nasional,Peserta,3230-10-01,8",
  "9985030001,Panitia,,,,,12",
  "9985030002,Seminar,Seminar atau pelatihan,Kampus,,,7.5",
  "9985030099,Seminar,,,,,4",
];

function csv(lines: string[], name = "skpm-oktober.csv") {
  return { name, bytes: new TextEncoder().encode(lines.join("\n")) };
}

async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 3230);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Unggah SKPM",
    3230,
    ["9985030001", "9985030002", "9985030003"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Unggah", ["assessor"]);
  return { periodId, ani, budi, citra, penilai };
}

async function countOf(db: Database, uploadId: string) {
  const uploads = await db
    .select()
    .from(skpmUploads)
    .where(eq(skpmUploads.id, uploadId));
  const rows = await db
    .select()
    .from(skpmRows)
    .where(eq(skpmRows.uploadId, uploadId));
  const lines = await db
    .select()
    .from(skpmUploadChanges)
    .where(eq(skpmUploadChanges.uploadId, uploadId));
  return { uploads: uploads.length, rows: rows.length, lines: lines.length };
}

async function totalsOf(db: Database, actor: { id: string; roles: RoleId[] }) {
  const list = await readSkpmList(
    db,
    skpmVisibleTo({ ...actor, studyProgramId: null, studentId: null }),
    50,
    { ...START_PARAMS, query: "99850300" },
  );
  return list.rows.map((row) => row.totals?.total ?? null);
}

describe("saveSkpmFile", () => {
  it("saves every ready row tied to one upload in the running period, with its counts and a line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const file = csv(ROWS);

      const saved = await saveSkpmFile(
        db,
        penilai,
        id,
        "add",
        file,
        false,
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { saved: 3, fileName: "skpm-oktober.csv" },
      });
      expect(saved.ok && savedMessage(saved.value)).toBe(
        "3 baris dari skpm-oktober.csv tersimpan.",
      );
      const [upload] = await db
        .select()
        .from(skpmUploads)
        .where(eq(skpmUploads.id, id));
      expect(upload).toMatchObject({
        fileName: "skpm-oktober.csv",
        fingerprint: fingerprintOf(file.bytes),
        mode: "add",
        periodId,
        rowCount: 3,
        studentCount: 2,
        enteredBy: penilai.id,
        enteredAt: MOMENT,
        removedAt: null,
      });
      const rows = await db
        .select()
        .from(skpmRows)
        .where(eq(skpmRows.uploadId, id))
        .orderBy(skpmRows.line);
      expect(rows[0]).toMatchObject({
        line: 2,
        studentId: ani,
        activity: "Lomba debat",
        category: "Lomba atau kompetisi",
        level: "Nasional",
        activityRole: "Peserta",
        day: "3230-10-01",
        points: 8,
      });
      expect(rows.map((row) => [row.category, row.points])).toEqual([
        ["Lomba atau kompetisi", 8],
        ["Lainnya", 12],
        ["Seminar atau pelatihan", 7.5],
      ]);
      const [line] = await db
        .select()
        .from(skpmUploadChanges)
        .where(eq(skpmUploadChanges.uploadId, id));
      expect(line).toMatchObject({
        changedBy: penilai.id,
        changedAt: MOMENT,
        action: "uploaded",
      });
      expect(await totalsOf(db, penilai)).toEqual([20, 7.5, null]);
    });
  });

  it("saves a file pressed twice once, and answers the second press as the first", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const first = await saveSkpmFile(
        db,
        penilai,
        id,
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );
      const second = await saveSkpmFile(
        db,
        penilai,
        id,
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );

      expect(second).toEqual(first);
      expect(await countOf(db, id)).toEqual({ uploads: 1, rows: 3, lines: 1 });
    });
  });

  it("refuses the key of a saved upload for another file, another mode or another account", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Unggah", [
        "head_of_unit",
      ]);
      const id = crypto.randomUUID();
      await saveSkpmFile(db, penilai, id, "add", csv(ROWS), false, MOMENT);
      const changed = csv([...ROWS, "9985030003,Seminar,,,,,1"]);

      expect(
        await saveSkpmFile(db, penilai, id, "add", changed, false, MOMENT),
      ).toEqual(FILE_ALREADY_SENT);
      expect(
        await saveSkpmFile(
          db,
          penilai,
          id,
          "replace",
          csv(ROWS),
          false,
          MOMENT,
        ),
      ).toEqual(FILE_ALREADY_SENT);
      expect(
        await saveSkpmFile(db, kepala, id, "add", csv(ROWS), false, MOMENT),
      ).toEqual(FILE_ALREADY_SENT);
      expect(await countOf(db, id)).toEqual({ uploads: 1, rows: 3, lines: 1 });
    });
  });

  it("refuses the same file saved again in Tambahkan by anyone without a confirm, saving nothing, and saves it with one", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Ulang", [
        "head_of_unit",
      ]);
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );
      const again = crypto.randomUUID();

      const refused = await saveSkpmFile(
        db,
        kepala,
        again,
        "add",
        csv(ROWS),
        false,
        LATER,
      );
      const refusedCount = await countOf(db, again);
      const confirmed = await saveSkpmFile(
        db,
        kepala,
        again,
        "add",
        csv(ROWS),
        true,
        LATER,
      );

      expect(refused).toEqual(repeatedFile("3230-10-12"));
      expect(refusedCount).toEqual({ uploads: 0, rows: 0, lines: 0 });
      expect(confirmed).toEqual({
        ok: true,
        value: { saved: 3, fileName: "skpm-oktober.csv" },
      });
      expect(await totalsOf(db, penilai)).toEqual([40, 15, null]);
    });
  });

  it("answers a second press of a confirmed repeat as the first, even without the confirm", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );
      const again = crypto.randomUUID();

      const first = await saveSkpmFile(
        db,
        penilai,
        again,
        "add",
        csv(ROWS),
        true,
        LATER,
      );
      const second = await saveSkpmFile(
        db,
        penilai,
        again,
        "add",
        csv(ROWS),
        false,
        LATER,
      );

      expect(second).toEqual(first);
      expect(await countOf(db, again)).toEqual({
        uploads: 1,
        rows: 3,
        lines: 1,
      });
    });
  });

  it("saves the same file again with no confirm once the earlier upload was removed", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const first = crypto.randomUUID();
      await saveSkpmFile(db, penilai, first, "add", csv(ROWS), false, MOMENT);
      await removeSkpmUpload(db, penilai, first, LATER);

      const again = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        LATER,
      );

      expect(again.ok).toBe(true);
    });
  });

  it("saves the same file again with no confirm once a Ganti semua data replaced it", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "replace",
        csv([TITLES, "9985030003,Seminar,,,,,1"], "skpm-baru.csv"),
        false,
        new Date("3230-10-13T03:00:00Z"),
      );

      const again = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        LATER,
      );

      expect(again.ok).toBe(true);
    });
  });

  it("never asks for the confirm in Ganti semua data", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );

      const replaced = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "replace",
        csv(ROWS),
        false,
        LATER,
      );

      expect(replaced.ok).toBe(true);
      expect(await totalsOf(db, penilai)).toEqual([20, 7.5, null]);
    });
  });

  it("does not take a file with another name or other rows for one saved before", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );

      const renamed = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS, "skpm-lain.csv"),
        false,
        LATER,
      );
      const changed = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv([...ROWS, "9985030003,Seminar,,,,,1"]),
        false,
        LATER,
      );

      expect(renamed.ok).toBe(true);
      expect(changed.ok).toBe(true);
    });
  });

  it("saves nothing of the file when one part of the save fails", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await db.execute(sql`
        create trigger skpm_file_test_fails before insert on skpm_upload_changes
        for each row execute function refuse_skpm_log_edit()`);
      const id = crypto.randomUUID();

      await expect(
        saveSkpmFile(db, penilai, id, "add", csv(ROWS), false, MOMENT),
      ).rejects.toThrow();

      expect(await countOf(db, id)).toEqual({ uploads: 0, rows: 0, lines: 0 });
    });
  });

  it("with Ganti semua data leaves out every upload before it, whatever its period", async () => {
    await inTestDatabase(async (db) => {
      const { ani, citra, penilai } = await addRecords(db);
      const earlier = await addTestPeriod(db, 3229);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId: earlier,
        enteredAt: new Date("3229-10-01T03:00:00Z"),
        rows: [
          { studentId: citra, points: 40 },
          { studentId: ani, points: 1 },
        ],
      });

      const saved = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "replace",
        csv(ROWS),
        false,
        MOMENT,
      );

      expect(saved.ok).toBe(true);
      expect(await totalsOf(db, penilai)).toEqual([20, 7.5, null]);
      const history = await readUploadHistory(db, 1);
      expect(history.lines.map((line) => [line.mode, line.state.kind])).toEqual(
        [
          ["replace", "in_force"],
          ["add", "replaced"],
        ],
      );
    });
  });

  it("keeps a row whose number in the file is past 32,767, after many empty lines", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const empty = Array.from({ length: 33_000 }, () => "");
      const id = crypto.randomUUID();
      const file = csv([TITLES, ...empty, "9985030001,Seminar,,,,,4"]);

      const saved = await saveSkpmFile(
        db,
        penilai,
        id,
        "add",
        file,
        false,
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { saved: 1, fileName: "skpm-oktober.csv" },
      });
      const [row] = await db
        .select()
        .from(skpmRows)
        .where(eq(skpmRows.uploadId, id));
      expect(row?.line).toBe(33_002);
    });
  });

  it("checks the file again when saving: a student no longer Aktif is skipped", async () => {
    await inTestDatabase(async (db) => {
      const { budi, penilai } = await addRecords(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, budi));

      const saved = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );

      expect(saved.ok && saved.value.saved).toBe(2);
    });
  });

  it("refuses a file with no row to save, one that is not CSV, an unknown mode and a key that is not one, saving nothing", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const none = await saveSkpmFile(
        db,
        penilai,
        id,
        "add",
        csv([TITLES, "9985030099,Seminar,,,,,4"]),
        false,
        MOMENT,
      );
      const notCsv = await saveSkpmFile(
        db,
        penilai,
        id,
        "add",
        { name: "skpm.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
        false,
        MOMENT,
      );
      const mode = await saveSkpmFile(db, penilai, id, "all", csv(ROWS), false);
      const key = await saveSkpmFile(db, penilai, "1", "add", csv(ROWS), false);

      expect(none).toEqual(NOTHING_TO_SAVE);
      expect(notCsv).toEqual({
        ok: false,
        error:
          "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
      });
      expect(mode).toEqual(UNKNOWN_MODE);
      expect(key).toEqual(FILE_ALREADY_SENT);
      expect(await countOf(db, id)).toEqual({ uploads: 0, rows: 0, lines: 0 });
    });
  });

  it("refuses while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      const saved = await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        new Date("3230-07-01T03:00:00Z"),
      );

      expect(saved).toEqual(NO_PERIOD);
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["a student", "student"],
  ])("refuses %s, who may not upload, saving nothing", async (_, role) => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const actor = await addTestActor(db, "Tanpa Hak Unggah", [role]);
      const id = crypto.randomUUID();

      const saved = await saveSkpmFile(
        db,
        actor,
        id,
        "add",
        csv(ROWS),
        false,
        MOMENT,
      );
      const preview = await previewSkpmFile(db, actor, csv(ROWS));

      expect(saved).toEqual(NOT_ALLOWED_TO_UPLOAD);
      expect(preview).toEqual(NOT_ALLOWED_TO_UPLOAD);
      expect(await countOf(db, id)).toEqual({ uploads: 0, rows: 0, lines: 0 });
    });
  });
});

describe("previewSkpmFile", () => {
  it("shows how many rows are ready, the first six and the skipped rows with why, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const many = Array.from(
        { length: 7 },
        (_, place) => `9985030001,Kegiatan ${place + 1},,,,,1`,
      );

      const preview = await previewSkpmFile(
        db,
        penilai,
        csv([TITLES, ...many, "9985030002,,,,,,1", "9985030099,A,,,,,1"]),
      );

      expect(preview.ok).toBe(true);
      if (!preview.ok) return;
      expect(preview.value).toMatchObject({
        ready: 7,
        students: 1,
        skipped: 2,
        firstSkipped: [
          { row: 9, nim: "9985030002", reason: "Nama kegiatan kosong." },
          {
            row: 10,
            nim: "9985030099",
            reason: "NIM tidak ada dalam data mahasiswa.",
          },
        ],
      });
      expect(preview.value.firstRows).toHaveLength(6);
      expect(await db.select().from(skpmUploads)).toEqual([]);
    });
  });

  it("names the day the same file was saved by anyone, only while that upload is in force", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Pratinjau", [
        "head_of_unit",
      ]);
      const savedOnOf = async () => {
        const preview = await previewSkpmFile(db, kepala, csv(ROWS));
        return preview.ok ? preview.value.savedOn : "refused";
      };
      const before = await savedOnOf();
      const first = crypto.randomUUID();
      await saveSkpmFile(db, penilai, first, "add", csv(ROWS), false, MOMENT);
      const saved = await savedOnOf();
      await removeSkpmUpload(db, penilai, first, LATER);
      const removed = await savedOnOf();
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "add",
        csv(ROWS),
        false,
        LATER,
      );
      await saveSkpmFile(
        db,
        penilai,
        crypto.randomUUID(),
        "replace",
        csv([TITLES, "9985030003,Seminar,,,,,1"], "skpm-baru.csv"),
        false,
        new Date("3230-10-15T03:00:00Z"),
      );
      const replaced = await savedOnOf();

      expect(before).toBe(null);
      expect(saved).toBe("3230-10-12");
      expect(removed).toBe(null);
      expect(replaced).toBe(null);
    });
  });

  it("says what is wrong with a file that is too large or empty", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const large = {
        name: "skpm.csv",
        bytes: new Uint8Array(1024 * 1024 + 1),
      };
      const empty = { name: "skpm.csv", bytes: new Uint8Array(0) };

      expect(await previewSkpmFile(db, penilai, large)).toEqual({
        ok: false,
        error:
          "Ukuran berkas lebih dari 1 MB. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
      });
      expect(await previewSkpmFile(db, penilai, empty)).toEqual({
        ok: false,
        error: "Berkas kosong. Isi berkas sesuai templat, lalu unggah lagi.",
      });
    });
  });
});

describe("removeSkpmUpload", () => {
  it("marks the upload removed with who and when, logs it, and works the values out without it", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Hapus", [
        "head_of_unit",
      ]);
      const id = crypto.randomUUID();
      await saveSkpmFile(db, penilai, id, "add", csv(ROWS), false, MOMENT);

      const removed = await removeSkpmUpload(db, kepala, id, LATER);

      expect(removed).toEqual({ ok: true, value: "skpm-oktober.csv" });
      const [upload] = await db
        .select()
        .from(skpmUploads)
        .where(eq(skpmUploads.id, id));
      expect(upload).toMatchObject({ removedBy: kepala.id, removedAt: LATER });
      expect(await countOf(db, id)).toEqual({ uploads: 1, rows: 3, lines: 2 });
      const lines = await db
        .select()
        .from(skpmUploadChanges)
        .where(eq(skpmUploadChanges.uploadId, id))
        .orderBy(skpmUploadChanges.changedAt);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["uploaded", penilai.id],
        ["removed", kepala.id],
      ]);
      expect(await totalsOf(db, penilai)).toEqual([null, null, null]);
      const history = await readUploadHistory(db, 1);
      expect(history.lines[0]?.state).toEqual({
        kind: "removed",
        at: LATER,
        by: "Kepala Uji Hapus",
      });
    });
  });

  it("refuses an upload removed before, and one that is not there", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      await saveSkpmFile(db, penilai, id, "add", csv(ROWS), false, MOMENT);
      await removeSkpmUpload(db, penilai, id, LATER);

      expect(await removeSkpmUpload(db, penilai, id, LATER)).toEqual(
        ALREADY_REMOVED,
      );
      expect(
        await removeSkpmUpload(db, penilai, crypto.randomUUID(), LATER),
      ).toEqual(UPLOAD_NOT_FOUND);
      expect(await removeSkpmUpload(db, penilai, "x", LATER)).toEqual(
        UPLOAD_NOT_FOUND,
      );
      expect(await countOf(db, id)).toMatchObject({ lines: 2 });
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["a student", "student"],
  ])("refuses %s, who may not remove an upload", async (_, role) => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      await saveSkpmFile(db, penilai, id, "add", csv(ROWS), false, MOMENT);
      const actor = await addTestActor(db, "Tanpa Hak Hapus", [role]);

      expect(await removeSkpmUpload(db, actor, id, LATER)).toEqual(
        NOT_ALLOWED_TO_UPLOAD,
      );
      expect(await countOf(db, id)).toMatchObject({ lines: 1 });
    });
  });
});
