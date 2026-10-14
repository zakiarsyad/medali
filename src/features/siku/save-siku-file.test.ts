// Sample Tahun akademik of this file: 2908 to 2908.
// Sample NIMs of this file: 9964001000 to 9964001099.
import { createHash } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
  sikuUploads,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelSikuEntry } from "./cancel-entry";
import {
  FILE_ALREADY_SENT,
  NOTHING_TO_SAVE,
  repeatedFile,
  saveSikuFile,
} from "./save-siku-file";
import { previewSikuFile } from "./siku-file-check";
import { NO_PERIOD, NOT_ALLOWED_TO_ADJUST } from "./siku-messages";
import { readTotalsOf } from "./siku-totals";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2908, in the odd period of 2908.
const MOMENT = new Date("2908-10-12T03:00:00Z");
const LATER = new Date("2908-10-14T03:00:00Z");

const TITLES = "nim,jenis,alasan,poin,keterangan";
const ROWS = [
  TITLES,
  "9964001001,tambah,1,3,Konten kampanye",
  "9964001002,kurang,3,5,Tidak hadir apel",
  "9964001001,kurang,4,2,SK-7/2908",
  "9964001099,tambah,1,2,",
];

function csv(lines: string[], name = "siku-oktober.csv") {
  return { name, bytes: new TextEncoder().encode(lines.join("\n")) };
}

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2908);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Simpan Berkas SIKU",
    2908,
    ["9964001001", "9964001002", "9964001003"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Berkas", ["assessor"]);
  return { periods, ani, budi, citra, penilai };
}

function rowsOf(db: Database, uploadId: string) {
  return db
    .select()
    .from(sikuAdjustments)
    .where(eq(sikuAdjustments.uploadId, uploadId));
}

async function countWhere(db: Database, uploadId: string) {
  const rows = await rowsOf(db, uploadId);
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return { rows: 0, students: 0, changes: 0 };
  const named = await db
    .select()
    .from(sikuAdjustmentStudents)
    .where(inArray(sikuAdjustmentStudents.adjustmentId, ids));
  const changes = await db
    .select()
    .from(sikuAdjustmentChanges)
    .where(inArray(sikuAdjustmentChanges.adjustmentId, ids));
  return { rows: rows.length, students: named.length, changes: changes.length };
}

describe("saveSikuFile", () => {
  it("saves every ready row as an entry of its own for its one student, tied to the upload, with a log line each", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const file = csv(ROWS);

      const saved = await saveSikuFile(db, penilai, id, file, false, MOMENT);

      expect(saved).toEqual({ ok: true, value: { saved: 3 } });
      const [upload] = await db
        .select()
        .from(sikuUploads)
        .where(eq(sikuUploads.id, id));
      expect(upload).toMatchObject({
        fileName: "siku-oktober.csv",
        fingerprint: createHash("sha256").update(file.bytes).digest("hex"),
        enteredBy: penilai.id,
        enteredAt: MOMENT,
      });
      const rows = await rowsOf(db, id);
      expect(
        rows
          .map((row) => [row.kind, row.reason, row.points, row.note, row.basis])
          .sort(),
      ).toEqual(
        [
          ["gain", "social_media_campaign", 3, "Konten kampanye", ""],
          ["loss", "unannounced_absence", 5, "Tidak hadir apel", ""],
          ["loss", "director_decision", 2, "", "SK-7/2908"],
        ].sort(),
      );
      for (const row of rows) {
        expect(row).toMatchObject({
          day: "2908-10-12",
          enteredBy: penilai.id,
          enteredAs: "assessor",
          enteredAt: MOMENT,
          cancelledAt: null,
        });
      }
      expect(await countWhere(db, id)).toEqual({
        rows: 3,
        students: 3,
        changes: 3,
      });
      const totals = await readTotalsOf(db, [ani, budi]);
      expect(totals.get(ani)).toEqual({ gains: 3, losses: 2 });
      expect(totals.get(budi)).toEqual({ gains: 0, losses: 5 });
    });
  });

  it("saves a file pressed twice once, and answers the second press as the first", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const first = await saveSikuFile(
        db,
        penilai,
        id,
        csv(ROWS),
        false,
        MOMENT,
      );
      const second = await saveSikuFile(
        db,
        penilai,
        id,
        csv(ROWS),
        false,
        MOMENT,
      );

      expect(second).toEqual(first);
      expect(await countWhere(db, id)).toEqual({
        rows: 3,
        students: 3,
        changes: 3,
      });
    });
  });

  it("refuses the key of a saved upload for another file or another account", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const other = await addTestActor(db, "Kepala Uji Berkas", [
        "head_of_unit",
      ]);
      const id = crypto.randomUUID();
      await saveSikuFile(db, penilai, id, csv(ROWS), false, MOMENT);

      const changed = csv([...ROWS, "9964001003,tambah,2,1,"]);

      expect(
        await saveSikuFile(db, penilai, id, changed, false, MOMENT),
      ).toEqual(FILE_ALREADY_SENT);
      expect(
        await saveSikuFile(db, other, id, csv(ROWS), false, MOMENT),
      ).toEqual(FILE_ALREADY_SENT);
      expect(await countWhere(db, id)).toMatchObject({ rows: 3 });
    });
  });

  it("refuses the key of an entry made with the form, saving nothing", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, penilai } = await addRecords(db);
      const formEntry = await addTestEntry(db, penilai, {
        kind: "gain",
        reason: "knowledge_sharing",
        points: 2,
        day: "2908-10-11",
        periodId: periods.odd,
        studentIds: [ani],
      });

      const saved = await saveSikuFile(
        db,
        penilai,
        formEntry,
        csv(ROWS),
        false,
        MOMENT,
      );

      expect(saved).toEqual(FILE_ALREADY_SENT);
      const uploads = await db
        .select()
        .from(sikuUploads)
        .where(eq(sikuUploads.id, formEntry));
      expect(uploads).toEqual([]);
    });
  });

  it("saves nothing of the file when one part of the save fails", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await db.execute(sql`
        create trigger siku_file_test_fails before insert on siku_adjustment_changes
        for each row execute function refuse_siku_adjustment_change_edit()`);
      const id = crypto.randomUUID();

      await expect(
        saveSikuFile(db, penilai, id, csv(ROWS), false, MOMENT),
      ).rejects.toThrow();

      expect(await countWhere(db, id)).toEqual({
        rows: 0,
        students: 0,
        changes: 0,
      });
      const uploads = await db
        .select()
        .from(sikuUploads)
        .where(eq(sikuUploads.id, id));
      expect(uploads).toEqual([]);
    });
  });

  it("refuses the same file saved again without a confirm, and saves it with one", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await saveSikuFile(
        db,
        penilai,
        crypto.randomUUID(),
        csv(ROWS),
        false,
        MOMENT,
      );
      const again = crypto.randomUUID();

      const refused = await saveSikuFile(
        db,
        penilai,
        again,
        csv(ROWS),
        false,
        LATER,
      );
      const confirmed = await saveSikuFile(
        db,
        penilai,
        again,
        csv(ROWS),
        true,
        LATER,
      );

      expect(refused).toEqual(repeatedFile("2908-10-12"));
      expect(confirmed).toEqual({ ok: true, value: { saved: 3 } });
    });
  });

  it("counts a file saved before only while a row of it is in force", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const first = crypto.randomUUID();
      await saveSikuFile(db, penilai, first, csv(ROWS), false, MOMENT);
      await cancelSikuEntry(db, penilai, first);

      const again = await saveSikuFile(
        db,
        penilai,
        crypto.randomUUID(),
        csv(ROWS),
        false,
        LATER,
      );

      expect(again).toEqual({ ok: true, value: { saved: 3 } });
    });
  });

  it("does not take a file with another name or other rows for one saved before", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      await saveSikuFile(
        db,
        penilai,
        crypto.randomUUID(),
        csv(ROWS),
        false,
        MOMENT,
      );

      const renamed = await saveSikuFile(
        db,
        penilai,
        crypto.randomUUID(),
        csv(ROWS, "siku-lain.csv"),
        false,
        LATER,
      );
      const changed = await saveSikuFile(
        db,
        penilai,
        crypto.randomUUID(),
        csv([...ROWS, "9964001003,tambah,2,1,"]),
        false,
        LATER,
      );

      expect(renamed.ok).toBe(true);
      expect(changed.ok).toBe(true);
    });
  });

  it("checks the file again when saving: a student no longer Aktif is skipped", async () => {
    await inTestDatabase(async (db) => {
      const { budi, penilai } = await addRecords(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, budi));
      const id = crypto.randomUUID();

      const saved = await saveSikuFile(
        db,
        penilai,
        id,
        csv(ROWS),
        false,
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: { saved: 2 } });
    });
  });

  it("refuses a file with no row to save, and one that is not CSV, saving nothing", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const none = await saveSikuFile(
        db,
        penilai,
        id,
        csv([TITLES, "9964001099,tambah,1,2,"]),
        false,
        MOMENT,
      );
      const notCsv = await saveSikuFile(
        db,
        penilai,
        id,
        { name: "siku.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
        false,
        MOMENT,
      );

      expect(none).toEqual(NOTHING_TO_SAVE);
      expect(notCsv).toEqual({
        ok: false,
        error:
          "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
      });
      expect(await countWhere(db, id)).toMatchObject({ rows: 0 });
    });
  });

  it("refuses while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      const saved = await saveSikuFile(
        db,
        penilai,
        crypto.randomUUID(),
        csv(ROWS),
        false,
        new Date("2908-07-01T03:00:00Z"),
      );

      expect(saved).toEqual(NO_PERIOD);
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["a student", "student"],
  ])("refuses %s, who may not enter SIKU, saving nothing", async (_, role) => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const actor = await addTestActor(db, "Tanpa Hak Simpan", [role]);
      const id = crypto.randomUUID();

      const saved = await saveSikuFile(db, actor, id, csv(ROWS), true, MOMENT);

      expect(saved).toEqual(NOT_ALLOWED_TO_ADJUST);
      expect(await countWhere(db, id)).toMatchObject({ rows: 0 });
    });
  });
});

describe("previewSikuFile of a file saved before", () => {
  it("names the day the same file was saved, while a row of it is in force", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const before = await previewSikuFile(db, penilai, csv(ROWS));
      const id = crypto.randomUUID();
      await saveSikuFile(db, penilai, id, csv(ROWS), false, MOMENT);

      const after = await previewSikuFile(db, penilai, csv(ROWS));
      await cancelSikuEntry(db, penilai, id);
      const cancelled = await previewSikuFile(db, penilai, csv(ROWS));

      expect(before.ok && before.value.savedOn).toBe(null);
      expect(after.ok && after.value.savedOn).toBe("2908-10-12");
      expect(cancelled.ok && cancelled.value.savedOn).toBe(null);
    });
  });
});
