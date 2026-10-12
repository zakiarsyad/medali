import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ALLOWED } from "./input-student";
import { previewStudentFile, type UploadedFile } from "./student-file-check";
import { FILE_COLUMNS } from "./student-file-columns";
import { cohortChoices, type InputContext } from "./student-input";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));
const PROGRAM = "Prodi Uji Pratinjau";

function csvFile(name: string, ...nims: string[]): UploadedFile {
  const titles = FILE_COLUMNS.map((column) => column.title).join(",");
  const rows = nims.map(
    (nim) => `${nim},Pratinjau Uji,${PROGRAM},Reguler,L,2026,,,,,,,`,
  );
  const text = [titles, ...rows].join("\n");
  return { name, bytes: new TextEncoder().encode(text) };
}

async function contextWithProgram(db: Database): Promise<InputContext> {
  const id = await addTestProgram(db, PROGRAM);
  return {
    programs: [{ id, name: PROGRAM }],
    cohortYears: cohortChoices(2026),
    campusEnding: "@kampus.example",
  };
}

describe("previewStudentFile", () => {
  it.each(ALLOWED)("lets %s see what a file would do", async (role) => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", [role]);

      const preview = await previewStudentFile(
        db,
        actor,
        csvFile("uji.csv", "9900000701"),
        context,
      );

      expect(preview.ok && preview.value).toMatchObject({
        ready: 1,
        broken: 0,
        registered: 0,
      });
    });
  });

  it("refuses every role without the right", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Tanpa Hak Uji", OTHERS);

      const preview = await previewStudentFile(
        db,
        actor,
        csvFile("uji.csv", "9900000702"),
        context,
      );

      expect(preview).toEqual(NOT_ALLOWED);
    });
  });

  it("skips a NIM that a student has, a removed one too, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const program = context.programs[0]?.id ?? 0;
      await addTestStudent(db, program, { nim: "9900000703", name: "Induk" });
      await addTestStudent(db, program, {
        nim: "9900000704",
        name: "Dihapus Uji",
        deletedAt: new Date(),
        deletedBy: actor.id,
      });
      const before = await db.$count(students);

      const preview = await previewStudentFile(
        db,
        actor,
        csvFile("uji.csv", "9900000703", "9900000704", "9900000705"),
        context,
      );

      expect(preview.ok && preview.value).toMatchObject({
        ready: 1,
        broken: 0,
        registered: 2,
        firstSkipped: [
          { row: 2, nim: "9900000703", reason: "NIM sudah terdaftar." },
          { row: 3, nim: "9900000704", reason: "NIM sudah terdaftar." },
        ],
      });
      expect(await db.$count(students)).toBe(before);
    });
  });

  it("refuses a file that is not CSV, before it is read", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

      const preview = await previewStudentFile(
        db,
        actor,
        csvFile("uji.xlsx", "9900000706"),
        context,
      );

      expect(preview).toEqual({
        ok: false,
        error:
          "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
      });
    });
  });
});
