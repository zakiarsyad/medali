import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { BAM_PAGE_SIZE, listBamStudents } from "./list-bam-students";
import {
  addTestManager,
  addTestProgram,
  addTestStudentAccount,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Daftar BAM";

function nim(place: number): string {
  return `99128002${String(place).padStart(2, "0")}`;
}

async function addMany(db: Database, howMany: number): Promise<void> {
  const program = await addTestProgram(db, PROGRAM);
  for (let place = 1; place <= howMany; place += 1) {
    await addTestStudentAccount(
      db,
      program,
      { nim: nim(place), name: `Pengurus Uji ${nim(place)}` },
      ["student", "bam_bphk"],
    );
  }
}

describe("listBamStudents", () => {
  it("lists nobody while no student holds a BAM role", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      await addTestStudentAccount(db, program, {
        nim: nim(1),
        name: "Mahasiswa Uji Biasa",
      });
      await addTestManager(db, ["bam_bphk"]);

      expect(await listBamStudents(db, 0)).toEqual({
        students: [],
        total: 0,
        page: 0,
      });
    });
  });

  it("gives name, NIM, program studi and the BAM roles in role order", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const accountId = await addTestStudentAccount(
        db,
        program,
        { nim: nim(1), name: "Wulan Uji Daftar" },
        ["bam_health", "student", "bam_bphk"],
      );

      const listed = await listBamStudents(db, 0);

      expect(listed.students).toEqual([
        {
          accountId,
          name: "Wulan Uji Daftar",
          nim: nim(1),
          studyProgram: PROGRAM,
          roles: ["bam_bphk", "bam_health"],
          isActive: true,
        },
      ]);
    });
  });

  it("keeps a student who is not Aktif or was removed, marked as not active", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const roles = ["student" as const, "bam_bphk" as const];
      await addTestStudentAccount(
        db,
        program,
        { nim: nim(1), name: "Uji A Aktif" },
        roles,
      );
      await addTestStudentAccount(
        db,
        program,
        { nim: nim(2), name: "Uji B Cuti", status: "on_leave" },
        roles,
      );
      await addTestStudentAccount(
        db,
        program,
        { nim: nim(3), name: "Uji C Non Aktif", status: "inactive" },
        roles,
      );
      const removed = await addTestStudentAccount(
        db,
        program,
        { nim: nim(4), name: "Uji D Dihapus", deletedAt: new Date() },
        roles,
      );
      await db
        .update(accounts)
        .set({ deletedAt: new Date() })
        .where(eq(accounts.id, removed));

      const listed = await listBamStudents(db, 0);

      expect(listed.total).toBe(4);
      expect(listed.students.map((student) => student.isActive)).toEqual([
        true,
        false,
        false,
        false,
      ]);
    });
  });

  it("gives 25 students a page, by name, with the number of all", async () => {
    await inTestDatabase(async (db) => {
      await addMany(db, BAM_PAGE_SIZE + 1);

      const first = await listBamStudents(db, 0);
      const second = await listBamStudents(db, 1);

      expect(first.total).toBe(26);
      expect(first.students).toHaveLength(25);
      expect(first.students[0]?.nim).toBe(nim(1));
      expect(second.students.map((student) => student.nim)).toEqual([nim(26)]);
    });
  });

  it("shows the last page when asked for one past the end", async () => {
    await inTestDatabase(async (db) => {
      await addMany(db, 1);

      const listed = await listBamStudents(db, 7);

      expect(listed.page).toBe(0);
      expect(listed.students).toHaveLength(1);
    });
  });
});
