import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountsInRoleOrder } from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, roleChanges, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listAddedStudents } from "./added-students";
import { NOT_ALLOWED } from "./input-student";
import { savedMessage, saveStudentFile } from "./save-student-file";
import type { UploadedFile } from "./student-file-check";
import { FILE_COLUMNS } from "./student-file-columns";
import { cohortChoices, type InputContext } from "./student-input";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));
const PROGRAM = "Prodi Uji Simpan";

/** A file of made-up students, each row a NIM and a name. */
function csvFile(name: string, ...rows: [nim: string, name: string][]) {
  const titles = FILE_COLUMNS.map((column) => column.title).join(",");
  const lines = rows.map(
    ([nim, studentName]) =>
      `${nim},${studentName},${PROGRAM},Alih program,P,2026,1-02,Riau,Direktorat Jenderal Pajak,ya,,,Cuti`,
  );
  const text = [titles, ...lines].join("\n");
  const file: UploadedFile = { name, bytes: new TextEncoder().encode(text) };
  return file;
}

async function contextWithProgram(db: Database): Promise<InputContext> {
  const id = await addTestProgram(db, PROGRAM);
  return {
    programs: [{ id, name: PROGRAM }],
    cohortYears: cohortChoices(2026),
  };
}

async function studentWithNim(db: Database, nim: string) {
  const [found] = await db.select().from(students).where(eq(students.nim, nim));
  return found;
}

describe("savedMessage", () => {
  it("says how many rows of which file were saved", () => {
    expect(savedMessage("mahasiswa.csv", { saved: 1200, takenSince: 0 })).toBe(
      "1.200 baris dari mahasiswa.csv tersimpan.",
    );
  });

  it("says how many rows were left out because their NIM was just taken", () => {
    expect(savedMessage("mahasiswa.csv", { saved: 3, takenSince: 2 })).toBe(
      "3 baris dari mahasiswa.csv tersimpan. 2 baris dilewati karena NIM-nya baru saja terdaftar.",
    );
  });
});

describe("saveStudentFile", () => {
  it.each(ALLOWED)(
    "lets %s save the ready rows, kept with who put them in, when and from which file",
    async (role) => {
      await inTestDatabase(async (db) => {
        const context = await contextWithProgram(db);
        const actor = await addTestActor(db, "Pegawai Uji", [role]);
        const file = csvFile(
          "mahasiswa uji.csv",
          ["9900000801", "Simpan Uji Satu"],
          ["9900000802", "Simpan Uji Dua"],
        );

        const saved = await saveStudentFile(db, actor, file, context);

        expect(saved).toEqual({
          ok: true,
          value: { saved: 2, takenSince: 0 },
        });
        const kept = await studentWithNim(db, "9900000802");
        expect(kept).toMatchObject({
          name: "Simpan Uji Dua",
          studyProgramId: context.programs[0]?.id,
          entryPath: "transfer",
          sex: "female",
          cohortYear: 2026,
          className: "1-02",
          province: "Riau",
          originAgency: "Direktorat Jenderal Pajak",
          status: "on_leave",
          isAffirmation: true,
          isSeedling: false,
          inputBy: actor.id,
          inputSource: "upload:mahasiswa uji.csv",
          deletedAt: null,
        });
        expect(kept?.inputAt).toBeInstanceOf(Date);
      });
    },
  );

  it("gives every saved student an account with the student role, logged, and lists them", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const file = csvFile(
        "uji.csv",
        ["9900000803", "Simpan Uji Tiga"],
        ["9900000804", "Simpan Uji Empat"],
      );

      await saveStudentFile(db, actor, file, context);

      const switchable = await accountsInRoleOrder(db);
      const kept = await db
        .select({ id: students.id })
        .from(students)
        .where(inArray(students.nim, ["9900000803", "9900000804"]));
      const studentIds = kept.map((student) => student.id);
      const made = switchable.filter(
        (account) =>
          account.studentId && studentIds.includes(account.studentId),
      );
      expect(made.map((account) => account.roles)).toEqual([
        ["student"],
        ["student"],
      ]);
      const lines = await db
        .select()
        .from(roleChanges)
        .where(
          inArray(
            roleChanges.accountId,
            made.map((account) => account.id),
          ),
        );
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatchObject({
        changedBy: actor.id,
        action: "added",
        rolesBefore: [],
        rolesAfter: ["student"],
      });
      const listed = await listAddedStudents(db, "Simpan Uji");
      expect(
        listed.students.map((student) => [student.nim, student.inputSource]),
      ).toEqual([
        ["9900000804", "upload:uji.csv"],
        ["9900000803", "upload:uji.csv"],
      ]);
    });
  });

  it("skips a NIM that is registered and never changes that student", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const program = context.programs[0]?.id ?? 0;
      await addTestStudent(db, program, { nim: "9900000805", name: "Induk" });
      const before = await studentWithNim(db, "9900000805");
      const file = csvFile(
        "uji.csv",
        ["9900000805", "Simpan Uji Lima"],
        ["9900000806", "Simpan Uji Enam"],
      );

      const saved = await saveStudentFile(db, actor, file, context);

      expect(saved).toEqual({ ok: true, value: { saved: 1, takenSince: 0 } });
      expect(await studentWithNim(db, "9900000805")).toEqual(before);
    });
  });

  it("refuses a file with no row to save, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const before = await db.$count(students);

      const saved = await saveStudentFile(
        db,
        actor,
        csvFile("uji.csv", ["12", "Simpan Uji Tujuh"]),
        context,
      );

      expect(saved).toEqual({
        ok: false,
        error:
          "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
      });
      expect(await db.$count(students)).toBe(before);
    });
  });

  it("refuses every role without the right, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Tanpa Hak Uji", OTHERS);
      const before = await db.$count(accounts);

      const saved = await saveStudentFile(
        db,
        actor,
        csvFile("uji.csv", ["9900000808", "Simpan Uji Delapan"]),
        context,
      );

      expect(saved).toEqual(NOT_ALLOWED);
      expect(await studentWithNim(db, "9900000808")).toBeUndefined();
      expect(await db.$count(accounts)).toBe(before);
    });
  });
});
