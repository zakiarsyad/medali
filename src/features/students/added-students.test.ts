// Sample NIMs of this file: 9900000200 to 9900000299, and 9900100000 to 9900100199.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  accounts,
  studentBatches,
  studentBatchFiles,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { PAGE_SIZE } from "@/ui/list-pages";
import { countStudents, listAddedStudents } from "./added-students";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const EARLIER = new Date("2026-10-10T03:00:00Z");
const LATER = new Date("2026-10-11T03:00:00Z");
/** The angkatan in semester 1 or 2, as the checks have it. */
const DORM_COHORTS = [2026];

describe("listAddedStudents", () => {
  it("names the kept file of a student saved from one, and none for the others", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Daftar");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const [batch] = await db
        .insert(studentBatches)
        .values({ inputAt: LATER, inputBy: staff.id })
        .returning({ id: studentBatches.id });
      const [file] = await db
        .insert(studentBatchFiles)
        .values({
          batchId: batch?.id ?? "",
          objectKey: "uji/daftar-1",
          fileName: "daftar uji.csv",
          byteSize: 10,
          contentType: "text/csv",
          keptAt: LATER,
          keptBy: staff.id,
        })
        .returning({ id: studentBatchFiles.id });
      const fromFile = {
        inputBy: staff.id,
        inputSource: "upload:daftar uji.csv" as const,
        inputAt: LATER,
      };
      await addTestStudent(db, program, {
        nim: "9900000211",
        name: "Daftar Uji Berkas A",
        ...fromFile,
        inputBatchId: batch?.id ?? null,
      });
      await addTestStudent(db, program, {
        nim: "9900000212",
        name: "Daftar Uji Berkas B",
        ...fromFile,
      });
      await addTestStudent(db, program, {
        nim: "9900000213",
        name: "Daftar Uji Berkas C",
        inputBy: staff.id,
        inputSource: "form",
        inputAt: LATER,
      });

      const listed = await listAddedStudents(db, "Daftar Uji Berkas", []);

      expect(file?.id).toBeTruthy();
      expect(
        listed.students.map((student) => [student.nim, student.fileId]),
      ).toEqual([
        ["9900000211", file?.id],
        ["9900000212", null],
        ["9900000213", null],
      ]);
      expect(listed.matching).toBe(3);
    });
  });

  it("lists only students put in through the tab, the newest first", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Daftar");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const input = { inputBy: staff.id, inputSource: "form" as const };
      await addTestStudent(db, program, {
        nim: "9900000201",
        name: "Daftar Uji Lama",
        ...input,
        inputAt: EARLIER,
      });
      await addTestStudent(db, program, {
        nim: "9900000202",
        name: "Daftar Uji Baru",
        className: "1-01",
        isAffirmation: true,
        ...input,
        inputAt: LATER,
      });
      await addTestStudent(db, program, {
        nim: "9900000203",
        name: "Daftar Uji Induk",
      });

      const listed = await listAddedStudents(db, "Daftar Uji", []);

      expect(listed.matching).toBe(2);
      expect(listed.students.map((student) => student.nim)).toEqual([
        "9900000202",
        "9900000201",
      ]);
      expect(listed.students[0]).toMatchObject({
        name: "Daftar Uji Baru",
        sex: "female",
        studyProgram: "Prodi Uji Daftar",
        entryPath: "regular",
        className: "1-01",
        cohortYear: 2026,
        status: "active",
        isAffirmation: true,
        isSeedling: false,
        inputAt: LATER,
        inputBy: "Pegawai Uji",
        inputSource: "form",
      });
    });
  });

  it("gives the address a student's account holds, and none for a student without one", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Alamat");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const input = { inputBy: staff.id, inputSource: "form" as const };
      const withAddress = await addTestStudent(db, program, {
        nim: "9900000207",
        name: "Alamat Uji Satu",
        ...input,
        inputAt: LATER,
      });
      const without = await addTestStudent(db, program, {
        nim: "9900000208",
        name: "Alamat Uji Dua",
        ...input,
        inputAt: EARLIER,
      });
      await db.insert(accounts).values([
        {
          name: "Alamat Uji Satu",
          studentId: withAddress,
          email: "alamat.uji@kampus.example",
        },
        { name: "Alamat Uji Dua", studentId: without },
      ]);

      const listed = await listAddedStudents(db, "Alamat Uji", []);

      expect(
        listed.students.map((student) => [student.nim, student.email]),
      ).toEqual([
        ["9900000207", "alamat.uji@kampus.example"],
        ["9900000208", null],
      ]);
    });
  });

  it("leaves out a removed student", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Hapus");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addTestStudent(db, program, {
        nim: "9900000204",
        name: "Dihapus Uji",
        inputBy: staff.id,
        inputSource: "form",
        inputAt: LATER,
        deletedAt: LATER,
        deletedBy: staff.id,
      });

      const listed = await listAddedStudents(db, "Dihapus Uji", []);

      expect(listed).toEqual({ students: [], matching: 0, page: 1 });
    });
  });

  it("narrows the list by a part of the name or of the NIM", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Cari");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const input = {
        inputBy: staff.id,
        inputSource: "form" as const,
        inputAt: LATER,
      };
      await addTestStudent(db, program, {
        nim: "9900000205",
        name: "Cari Uji Satu",
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000206",
        name: "Cari Uji Dua",
        ...input,
      });

      const byName = await listAddedStudents(db, "uji dua", []);
      const byNim = await listAddedStudents(db, "99000002", []);
      const literal = await listAddedStudents(db, "Cari%Dua", []);

      expect(byName.students.map((s) => s.nim)).toEqual(["9900000206"]);
      expect(byNim.students.map((s) => s.nim).sort()).toEqual([
        "9900000205",
        "9900000206",
      ]);
      expect(literal.students).toEqual([]);
    });
  });

  it("gives one page of rows, and says how many match in all", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Batas");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      // All alike but the NIM, so the pages part only by it.
      for (let place = 0; place <= 2 * PAGE_SIZE; place++) {
        await addTestStudent(db, program, {
          nim: String(9900100000 + place),
          name: "Batas Uji",
          inputBy: staff.id,
          inputSource: "form",
          inputAt: LATER,
        });
      }

      const pages = await Promise.all(
        [1, 2, 3].map((page) => listAddedStudents(db, "Batas Uji", [], page)),
      );
      const nims = pages.flatMap((one) => one.students.map((s) => s.nim));

      expect(pages.map((one) => one.students.length)).toEqual([
        PAGE_SIZE,
        PAGE_SIZE,
        1,
      ]);
      expect(pages.map((one) => one.matching)).toEqual([51, 51, 51]);
      expect(pages.map((one) => one.page)).toEqual([1, 2, 3]);
      expect(new Set(nims).size).toBe(2 * PAGE_SIZE + 1);
    });
  });

  it("gives the last page for a page past it, and the first when nothing matches", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Batas");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      for (let place = 0; place <= PAGE_SIZE; place++) {
        await addTestStudent(db, program, {
          nim: String(9900100100 + place),
          name: "Lewat Uji",
          inputBy: staff.id,
          inputSource: "form",
          inputAt: LATER,
        });
      }

      const past = await listAddedStudents(db, "Lewat Uji", [], 9);
      const none = await listAddedStudents(db, "Tidak Ada Uji", [], 9);

      expect(past.page).toBe(2);
      expect(past.students.map((s) => s.nim)).toEqual([
        String(9900100100 + PAGE_SIZE),
      ]);
      expect(none).toEqual({ students: [], matching: 0, page: 1 });
    });
  });

  it("gives each student the dorm they live in today, and none to the others", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Daftar");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const input = {
        inputBy: staff.id,
        inputSource: "form" as const,
        inputAt: LATER,
      };
      await addTestStudent(db, program, {
        nim: "9900000231",
        name: "Asrama Uji A",
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000232",
        name: "Asrama Uji B",
        sex: "male",
        cohortYear: 2023,
        isInternational: true,
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000233",
        name: "Asrama Uji C",
        cohortYear: 2023,
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000234",
        name: "Asrama Uji D",
        status: "on_leave",
        ...input,
      });

      const listed = await listAddedStudents(db, "Asrama Uji", DORM_COHORTS);

      expect(
        listed.students.map((student) => [student.nim, student.dorm]),
      ).toEqual([
        ["9900000231", "dana_rakca"],
        ["9900000232", "wismantara_putra"],
        ["9900000233", null],
        ["9900000234", null],
      ]);
    });
  });
});

describe("countStudents", () => {
  it("counts all students and those put in through the tab, without the removed", async () => {
    await inTestDatabase(async (db) => {
      const before = await countStudents(db, []);
      const program = await addTestProgram(db, "Prodi Uji Hitung");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const input = {
        inputBy: staff.id,
        inputSource: "form" as const,
        inputAt: LATER,
      };
      await addTestStudent(db, program, { nim: "9900000207", name: "Induk" });
      await addTestStudent(db, program, {
        nim: "9900000208",
        name: "Induk Cuti",
        status: "on_leave",
      });
      await addTestStudent(db, program, {
        nim: "9900000209",
        name: "Masuk",
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000210",
        name: "Masuk Non Aktif",
        status: "inactive",
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000211",
        name: "Masuk Dihapus",
        ...input,
        deletedAt: LATER,
        deletedBy: staff.id,
      });

      const after = await countStudents(db, []);

      expect(after).toEqual({
        total: before.total + 4,
        active: before.active + 2,
        added: before.added + 2,
        addedActive: before.addedActive + 1,
        addedResidents: before.addedResidents,
        addedWithoutGroup: before.addedWithoutGroup + 1,
      });
    });
  });

  it("counts the residents among those put in through the tab and not removed", async () => {
    await inTestDatabase(async (db) => {
      const before = await countStudents(db, DORM_COHORTS);
      const program = await addTestProgram(db, "Prodi Uji Hitung");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const input = {
        inputBy: staff.id,
        inputSource: "form" as const,
        inputAt: LATER,
      };
      await addTestStudent(db, program, {
        nim: "9900000221",
        name: "Induk Penghuni",
      });
      await addTestStudent(db, program, {
        nim: "9900000222",
        name: "Masuk Penghuni",
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000223",
        name: "Masuk Pembibitan",
        cohortYear: 2023,
        isSeedling: true,
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000224",
        name: "Masuk Semester Lanjut",
        cohortYear: 2023,
        ...input,
      });
      await addTestStudent(db, program, {
        nim: "9900000225",
        name: "Masuk Penghuni Dihapus",
        ...input,
        deletedAt: LATER,
        deletedBy: staff.id,
      });

      const after = await countStudents(db, DORM_COHORTS);

      expect(after.addedResidents).toBe(before.addedResidents + 2);
    });
  });

  it("leaves out a student who stops being a resident, on the next read", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Hitung");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addTestStudent(db, program, {
        nim: "9900000226",
        name: "Masuk Lalu Cuti",
        inputBy: staff.id,
        inputSource: "form",
        inputAt: LATER,
      });
      const asResident = await countStudents(db, DORM_COHORTS);

      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.nim, "9900000226"));
      const onLeave = await countStudents(db, DORM_COHORTS);

      expect(onLeave.addedResidents).toBe(asResident.addedResidents - 1);
    });
  });
});
