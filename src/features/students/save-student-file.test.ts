import { asc, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountsInRoleOrder } from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, roleChanges, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore } from "@/files/memory-store";
import { listAddedStudents } from "./added-students";
import type { FilePreview } from "./file-preview";
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

/** A file of made-up students, each row a NIM, a name and maybe an address. */
function csvFile(
  name: string,
  ...rows: [nim: string, name: string, email?: string][]
) {
  const titles = FILE_COLUMNS.map((column) => column.title).join(",");
  const lines = rows.map(
    ([nim, studentName, email = ""]) =>
      `${nim},${studentName},${PROGRAM},Alih program,P,2026,1-02,Riau,Direktorat Jenderal Pajak,ya,,,Cuti,${email}`,
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
    campusEnding: "@kampus.example",
  };
}

async function studentWithNim(db: Database, nim: string) {
  const [found] = await db.select().from(students).where(eq(students.nim, nim));
  return found;
}

/** The address on the account of each of these students, by NIM. */
async function emailsByNim(db: Database, nims: string[]) {
  const found = await db
    .select({ nim: students.nim, email: accounts.email })
    .from(students)
    .innerJoin(accounts, eq(accounts.studentId, students.id))
    .where(inArray(students.nim, nims))
    .orderBy(asc(students.nim));
  return found.map(({ nim, email }) => [nim, email]);
}

function skippedPreview(broken: number, registered: number): FilePreview {
  return {
    ready: 0,
    firstRows: [],
    broken,
    registered,
    firstSkipped: [],
    repeated: 0,
  };
}

describe("savedMessage", () => {
  it("says how many rows of which file were saved", () => {
    const result = { saved: 1200, preview: skippedPreview(0, 0) };

    expect(savedMessage("mahasiswa.csv", result)).toBe(
      "1.200 baris dari mahasiswa.csv tersimpan.",
    );
  });

  it("says how many rows were skipped, whatever the reason", () => {
    const result = { saved: 3, preview: skippedPreview(2, 5) };

    expect(savedMessage("mahasiswa.csv", result)).toBe(
      "3 baris dari mahasiswa.csv tersimpan. 7 baris dilewati.",
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

        const saved = await saveStudentFile(
          db,
          memoryStore(),
          actor,
          file,
          context,
        );

        expect(saved.ok && saved.value).toMatchObject({
          saved: 2,
          preview: { broken: 0, registered: 0, firstSkipped: [] },
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

      await saveStudentFile(db, memoryStore(), actor, file, context);

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
        ["12", "Simpan Uji Salah"],
      );

      const saved = await saveStudentFile(
        db,
        memoryStore(),
        actor,
        file,
        context,
      );

      expect(saved.ok && saved.value).toMatchObject({
        saved: 1,
        preview: {
          broken: 1,
          registered: 1,
          firstSkipped: [
            { row: 4, nim: "12", reason: "NIM harus 10 digit angka." },
            { row: 2, nim: "9900000805", reason: "NIM sudah terdaftar." },
          ],
        },
      });
      expect(await studentWithNim(db, "9900000805")).toEqual(before);
    });
  });

  it("keeps the address of a row on the student's account, and saves a row with none without one", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const file = csvFile(
        "uji.csv",
        ["9900000811", "Alamat Berkas Satu", "Berkas.Satu@Kampus.Example"],
        ["9900000812", "Alamat Berkas Dua"],
      );

      const saved = await saveStudentFile(
        db,
        memoryStore(),
        actor,
        file,
        context,
      );

      expect(saved.ok && saved.value.saved).toBe(2);
      expect(await emailsByNim(db, ["9900000811", "9900000812"])).toEqual([
        ["9900000811", "berkas.satu@kampus.example"],
        ["9900000812", null],
      ]);
    });
  });

  it("skips a row with a wrong, a used or a repeated address, and saves the others", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await db.insert(accounts).values({
        name: "Pegawai Lain",
        email: "dipakai.berkas@kampus.example",
      });
      const file = csvFile(
        "uji.csv",
        ["9900000813", "Alamat Berkas Tiga", "dipakai.berkas@kampus.example"],
        ["9900000814", "Alamat Berkas Empat", "berkas.empat"],
        ["9900000815", "Alamat Berkas Lima", "berkas.lima@luar.example"],
        ["9900000816", "Alamat Berkas Enam", "kembar.berkas@kampus.example"],
        ["9900000817", "Alamat Berkas Tujuh", "kembar.berkas@kampus.example"],
      );

      const saved = await saveStudentFile(
        db,
        memoryStore(),
        actor,
        file,
        context,
      );

      expect(saved.ok && saved.value).toMatchObject({
        saved: 1,
        preview: {
          broken: 4,
          registered: 0,
          firstSkipped: [
            {
              row: 2,
              nim: "9900000813",
              reason: "Email sudah dipakai akun lain.",
            },
            { row: 3, nim: "9900000814", reason: "Alamat email tidak valid." },
            {
              row: 4,
              nim: "9900000815",
              reason: "Gunakan alamat email kampus.",
            },
            {
              row: 6,
              nim: "9900000817",
              reason: "Email sudah dipakai akun lain.",
            },
          ],
        },
      });
      expect(await studentWithNim(db, "9900000813")).toBeUndefined();
      expect(await emailsByNim(db, ["9900000816", "9900000817"])).toEqual([
        ["9900000816", "kembar.berkas@kampus.example"],
      ]);
    });
  });

  it("never gives an address to a student who is already there", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const first = csvFile("uji.csv", ["9900000818", "Alamat Berkas Lama"]);
      await saveStudentFile(db, memoryStore(), actor, first, context);
      const again = csvFile(
        "uji.csv",
        ["9900000818", "Alamat Berkas Lama", "berkas.lama@kampus.example"],
        ["9900000819", "Alamat Berkas Baru", "berkas.lama@kampus.example"],
      );

      const saved = await saveStudentFile(
        db,
        memoryStore(),
        actor,
        again,
        context,
      );

      expect(saved.ok && saved.value).toMatchObject({
        saved: 1,
        preview: { broken: 0, registered: 1 },
      });
      expect(await emailsByNim(db, ["9900000818", "9900000819"])).toEqual([
        ["9900000818", null],
        ["9900000819", "berkas.lama@kampus.example"],
      ]);
    });
  });

  it("refuses a file with no row to save, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const context = await contextWithProgram(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const before = await db.$count(students);

      const saved = await saveStudentFile(
        db,
        memoryStore(),
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
        memoryStore(),
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
