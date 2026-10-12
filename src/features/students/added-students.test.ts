import { describe, expect, it } from "vitest";
import { studentBatches, studentBatchFiles } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { countStudents, LIST_LIMIT, listAddedStudents } from "./added-students";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const EARLIER = new Date("2026-10-10T03:00:00Z");
const LATER = new Date("2026-10-11T03:00:00Z");

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

      const listed = await listAddedStudents(db, "Daftar Uji Berkas");

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

      const listed = await listAddedStudents(db, "Daftar Uji");

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

      const listed = await listAddedStudents(db, "Dihapus Uji");

      expect(listed).toEqual({ students: [], matching: 0 });
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

      const byName = await listAddedStudents(db, "uji dua");
      const byNim = await listAddedStudents(db, "99000002");
      const literal = await listAddedStudents(db, "Cari%Dua");

      expect(byName.students.map((s) => s.nim)).toEqual(["9900000206"]);
      expect(byNim.students.map((s) => s.nim).sort()).toEqual([
        "9900000205",
        "9900000206",
      ]);
      expect(literal.students).toEqual([]);
    });
  });

  it("gives no more rows than the list shows, and says how many match", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Batas");
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      for (let place = 0; place <= LIST_LIMIT; place++) {
        await addTestStudent(db, program, {
          nim: String(9900100000 + place),
          name: "Batas Uji",
          inputBy: staff.id,
          inputSource: "form",
          inputAt: LATER,
        });
      }

      const listed = await listAddedStudents(db, "Batas Uji");

      expect(listed.students).toHaveLength(LIST_LIMIT);
      expect(listed.matching).toBe(LIST_LIMIT + 1);
    });
  });
});

describe("countStudents", () => {
  it("counts all students and those put in through the tab, without the removed", async () => {
    await inTestDatabase(async (db) => {
      const before = await countStudents(db);
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

      const after = await countStudents(db);

      expect(after).toEqual({
        total: before.total + 4,
        active: before.active + 2,
        added: before.added + 2,
        addedActive: before.addedActive + 1,
      });
    });
  });
});
