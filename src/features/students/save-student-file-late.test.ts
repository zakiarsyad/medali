import { eq, inArray } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import {
  accounts,
  studentBatches,
  studentBatchFiles,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore } from "@/files/memory-store";
import { saveStudentFile } from "./save-student-file";
import type { FileRows } from "./student-file";
import { checkStudentFile } from "./student-file-check";
import {
  cohortChoices,
  type InputContext,
  type StudentInput,
} from "./student-input";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

// The check of the file is replaced here by one that still finds a NIM
// free, as it was a moment before another person registered it.
vi.mock("./student-file-check", () => ({ checkStudentFile: vi.fn() }));

const inTestDatabase = withTestDatabase();

/** The check is replaced, so only the name and the bytes to keep matter. */
const FILE = {
  name: "uji.csv",
  bytes: new TextEncoder().encode("nim,nama\n9900000901,Simpan Uji Telat\n"),
};

function contextWith(program: number): InputContext {
  return {
    programs: [{ id: program, name: "Prodi Uji Telat" }],
    cohortYears: cohortChoices(2026),
    campusEnding: "@kampus.example",
  };
}

function student(nim: string, studyProgramId: number): StudentInput {
  return {
    nim,
    name: "Simpan Uji Telat",
    email: null,
    studyProgramId,
    entryPath: "regular",
    sex: "female",
    cohortYear: 2026,
    className: null,
    province: null,
    originAgency: null,
    status: "active",
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
  };
}

describe("saveStudentFile, when a NIM is taken between the check and the save", () => {
  it("saves the other rows, lists that row as registered, and leaves its student alone", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Telat");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addTestStudent(db, program, { nim: "9900000902", name: "Induk" });
      const accountsBefore = await db.$count(accounts);
      const checked: FileRows = {
        ready: [
          { row: 2, student: student("9900000901", program) },
          { row: 3, student: student("9900000902", program) },
          { row: 5, student: student("9900000903", program) },
        ],
        skipped: [{ row: 4, nim: "12", reason: "NIM harus 10 digit angka." }],
        registered: [],
        repeated: 0,
      };
      vi.mocked(checkStudentFile).mockResolvedValue({
        ok: true,
        value: checked,
      });

      const saved = await saveStudentFile(
        db,
        memoryStore(),
        actor,
        FILE,
        contextWith(program),
      );

      expect(saved.ok && saved.value).toMatchObject({
        saved: 2,
        preview: {
          ready: 2,
          broken: 1,
          registered: 1,
          firstSkipped: [
            { row: 4, nim: "12", reason: "NIM harus 10 digit angka." },
            { row: 3, nim: "9900000902", reason: "NIM sudah terdaftar." },
          ],
        },
      });
      const kept = await db
        .select({ name: students.name, inputSource: students.inputSource })
        .from(students)
        .where(eq(students.nim, "9900000902"));
      expect(kept).toEqual([{ name: "Induk", inputSource: null }]);
      expect(await db.$count(accounts)).toBe(accountsBefore + 2);
    });
  });
});

describe("saveStudentFile, when Simpan is pressed twice quickly", () => {
  it("keeps the rows and the file once: the second press finds nothing to save and keeps no file", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Telat");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const store = memoryStore();
      // Both presses passed the check before either had saved.
      vi.mocked(checkStudentFile).mockResolvedValue({
        ok: true,
        value: {
          ready: [
            { row: 2, student: student("9900000911", program) },
            { row: 3, student: student("9900000912", program) },
          ],
          skipped: [],
          registered: [],
          repeated: 0,
        },
      });
      const context = contextWith(program);

      const first = await saveStudentFile(db, store, actor, FILE, context);
      const second = await saveStudentFile(db, store, actor, FILE, context);

      expect(first.ok && first.value.saved).toBe(2);
      expect(second).toEqual({
        ok: false,
        error:
          "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
      });
      expect(store.files.size).toBe(1);
      expect(await db.$count(studentBatches)).toBe(1);
      expect(await db.$count(studentBatchFiles)).toBe(1);
      const saved = await db
        .select({ nim: students.nim })
        .from(students)
        .where(inArray(students.nim, ["9900000911", "9900000912"]));
      expect(saved.length).toBe(2);
    });
  });
});
