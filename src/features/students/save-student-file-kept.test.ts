// Sample NIMs of this file: 9900001000 to 9900001099.
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db/connect";
import { studentBatches, studentBatchFiles, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { FileStore } from "@/files/file-store";
import { memoryStore, unreachableStore } from "@/files/memory-store";
import { listAddedStudents } from "./added-students";
import { saveStudentFile } from "./save-student-file";
import type { UploadedFile } from "./student-file-check";
import { FILE_COLUMNS } from "./student-file-columns";
import { cohortChoices, type InputContext } from "./student-input";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Berkas";
const NOT_KEPT = {
  ok: false,
  error: "Berkas tidak dapat disimpan. Coba lagi.",
};

/** A file of made-up students, one row per NIM. */
function csvFile(name: string, ...nims: string[]): UploadedFile {
  const titles = FILE_COLUMNS.map((column) => column.title).join(",");
  const lines = nims.map(
    (nim) => `${nim},Berkas Uji ${nim},${PROGRAM},Reguler,L,2026,,,,,,,Aktif`,
  );
  const text = [titles, ...lines].join("\r\n");
  return { name, bytes: new TextEncoder().encode(text) };
}

async function contextWithProgram(db: Database): Promise<InputContext> {
  const id = await addTestProgram(db, PROGRAM);
  return {
    programs: [{ id, name: PROGRAM }],
    cohortYears: cohortChoices(2026),
  };
}

async function countsOf(db: Database) {
  return {
    students: await db.$count(students),
    batches: await db.$count(studentBatches),
    files: await db.$count(studentBatchFiles),
  };
}

/** The log is the only trace of a storage that failed; kept out of the output. */
function quietLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveStudentFile, keeping the file", () => {
  it("keeps the file unchanged, with one batch that its students and its record point to", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const store = memoryStore();
      const file = csvFile("mahasiswa uji.csv", "9900001001", "9900001002");

      const saved = await saveStudentFile(db, store, actor, file, context);

      expect(saved.ok && saved.value.saved).toBe(2);
      const [batch, ...moreBatches] = await db.select().from(studentBatches);
      const [record, ...moreRecords] = await db
        .select()
        .from(studentBatchFiles);
      expect(moreBatches).toEqual([]);
      expect(moreRecords).toEqual([]);
      expect(batch?.inputBy).toBe(actor.id);
      expect(record).toMatchObject({
        batchId: batch?.id,
        fileName: "mahasiswa uji.csv",
        byteSize: file.bytes.length,
        contentType: "text/csv; charset=utf-8",
        keptBy: actor.id,
        keptAt: batch?.inputAt,
      });
      expect(record?.objectKey).toMatch(/^student-files\/[0-9a-f-]{36}$/);
      expect([...store.files.keys()]).toEqual([record?.objectKey]);
      expect(store.files.get(record?.objectKey ?? "")?.bytes).toEqual(
        file.bytes,
      );
      const inBatch = await db
        .select({ nim: students.nim, inputAt: students.inputAt })
        .from(students)
        .where(eq(students.inputBatchId, batch?.id ?? ""));
      expect(inBatch.map((student) => student.nim).sort()).toEqual([
        "9900001001",
        "9900001002",
      ]);
      expect(inBatch[0]?.inputAt).toEqual(batch?.inputAt);
    });
  });

  it("leaves a student who was already there out of the batch", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const program = context.programs[0]?.id ?? 0;
      await addTestStudent(db, program, { nim: "9900001003", name: "Induk" });
      const file = csvFile("uji.csv", "9900001003", "9900001004");

      await saveStudentFile(db, memoryStore(), actor, file, context);

      const [kept] = await db
        .select({ inputBatchId: students.inputBatchId })
        .from(students)
        .where(eq(students.nim, "9900001003"));
      expect(kept).toEqual({ inputBatchId: null });
    });
  });

  it("saves no student when the file storage cannot be reached, and says to try again", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const before = await countsOf(db);
      const logged = quietLog();
      const file = csvFile("uji.csv", "9900001005");

      const saved = await saveStudentFile(
        db,
        unreachableStore(),
        actor,
        file,
        context,
      );

      expect(saved).toEqual(NOT_KEPT);
      expect(await countsOf(db)).toEqual(before);
      expect(logged).toHaveBeenCalledOnce();
    });
  });

  it("logs nothing of the file or its people when the file storage fails", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const logged = quietLog();
      const file = csvFile("rahasia-uji.csv", "9900001006");

      await saveStudentFile(db, unreachableStore(), actor, file, context);

      const written = JSON.stringify(logged.mock.calls.flat().map(String));
      expect(written).not.toContain("rahasia-uji");
      expect(written).not.toContain("9900001006");
      expect(written).not.toContain("Berkas Uji");
    });
  });

  it("removes the kept file again when the students cannot be saved", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const before = await countsOf(db);
      const store = memoryStore();
      // An account that does not exist: the database refuses its batch.
      const ghost = {
        id: "00000000-0000-4000-8000-000000000000",
        roles: ["upk_staff"] as const,
      };
      const file = csvFile("uji.csv", "9900001007");

      const saving = saveStudentFile(db, store, ghost, file, context);

      await expect(saving).rejects.toThrow();
      expect(store.files.size).toBe(0);
      expect(await countsOf(db)).toEqual(before);
    });
  });

  it("still fails loudly when the students cannot be saved and the kept file cannot be removed", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const logged = quietLog();
      const kept = memoryStore();
      const store: FileStore = {
        ...kept,
        remove: () => Promise.reject(new Error("The storage went away.")),
      };
      const ghost = {
        id: "00000000-0000-4000-8000-000000000000",
        roles: ["upk_staff"] as const,
      };
      const file = csvFile("uji.csv", "9900001008");

      const saving = saveStudentFile(db, store, ghost, file, context);

      await expect(saving).rejects.toThrow();
      expect(logged).toHaveBeenCalledOnce();
      expect(await db.$count(studentBatchFiles)).toBe(0);
    });
  });

  it.each([
    ["no row to save", csvFile("uji.csv", "12")],
    ["a name that is not CSV", csvFile("uji.xlsx", "9900001009")],
    [
      "a picture renamed to .csv",
      {
        name: "foto.csv",
        bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      },
    ],
    [
      "more than 1 MB",
      { name: "besar.csv", bytes: new Uint8Array(1024 * 1024 + 1).fill(97) },
    ],
  ])("keeps nothing of a file with %s", async (_what, file) => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const before = await countsOf(db);
      const store = memoryStore();

      const saved = await saveStudentFile(db, store, actor, file, context);

      expect(saved.ok).toBe(false);
      expect(store.files.size).toBe(0);
      expect(await countsOf(db)).toEqual(before);
    });
  });

  it("keeps nothing for a role without the right", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pengasuh Uji", ["mentor"]);
      const store = memoryStore();
      const file = csvFile("uji.csv", "9900001010");

      const saved = await saveStudentFile(db, store, actor, file, context);

      expect(saved.ok).toBe(false);
      expect(store.files.size).toBe(0);
      expect(await db.$count(studentBatches)).toBe(0);
    });
  });
});

describe("saveStudentFile, where file keeping is off", () => {
  it("saves the students as before, with no batch and no file, so the list shows no link", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const file = csvFile("mahasiswa uji.csv", "9900001011", "9900001012");

      const saved = await saveStudentFile(db, null, actor, file, context);

      expect(saved.ok && saved.value.saved).toBe(2);
      expect(await db.$count(studentBatches)).toBe(0);
      expect(await db.$count(studentBatchFiles)).toBe(0);
      const listed = await listAddedStudents(db, "9900001011");
      expect(listed.students).toMatchObject([
        {
          nim: "9900001011",
          inputBy: "Pegawai Uji",
          inputSource: "upload:mahasiswa uji.csv",
          fileId: null,
        },
      ]);
    });
  });
});
