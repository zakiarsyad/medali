import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { SEARCH_LIMIT, searchActiveStudents } from "./search-students";
import {
  addTestProgram,
  addTestStudentAccount,
  type TestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Cari BAM";

function nim(place: number): string {
  return `99128003${String(place).padStart(2, "0")}`;
}

async function names(db: Database, query: string): Promise<string[]> {
  const found = await searchActiveStudents(db, query);
  return found.map((student) => student.name);
}

describe("searchActiveStudents", () => {
  it("finds an Aktif student by part of the name or of the NIM", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const accountId = await addTestStudentAccount(db, program, {
        nim: nim(1),
        name: "Laras Uji Cari",
      });

      const byName = await searchActiveStudents(db, " laras uji ");
      const byNim = await searchActiveStudents(db, nim(1).slice(2));

      expect(byName).toEqual([
        {
          accountId,
          name: "Laras Uji Cari",
          nim: nim(1),
          studyProgram: PROGRAM,
        },
      ]);
      expect(byNim).toEqual(byName);
    });
  });

  it("offers nobody for an empty search", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      await addTestStudentAccount(db, program, {
        nim: nim(1),
        name: "Laras Uji Cari",
      });

      expect(await searchActiveStudents(db, "   ")).toEqual([]);
    });
  });

  it("leaves out a student on Cuti, Non aktif or removed", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const add = (place: number, more: Partial<TestStudent>) =>
        addTestStudentAccount(db, program, {
          nim: nim(place),
          name: `Saring Uji Cari ${place}`,
          ...more,
        });
      await add(1, {});
      await add(2, { status: "on_leave" });
      await add(3, { status: "inactive" });
      await add(4, { deletedAt: new Date() });
      const removedAccount = await add(5, {});
      await db
        .update(accounts)
        .set({ deletedAt: new Date() })
        .where(eq(accounts.id, removedAccount));

      expect(await names(db, "saring uji cari")).toEqual(["Saring Uji Cari 1"]);
    });
  });

  it("leaves out a student who already holds a BAM role", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const add = (place: number, roles: RoleId[]) =>
        addTestStudentAccount(
          db,
          program,
          { nim: nim(place), name: `Pengurus Uji Cari ${place}` },
          roles,
        );
      await add(1, ["student"]);
      await add(2, ["student", "bam_health"]);

      expect(await names(db, "pengurus uji cari")).toEqual([
        "Pengurus Uji Cari 1",
      ]);
    });
  });

  it("offers at most 10 students, by name", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      for (let place = SEARCH_LIMIT + 2; place >= 1; place -= 1) {
        await addTestStudentAccount(db, program, {
          nim: nim(place),
          name: `Banyak Uji Cari ${String(place).padStart(2, "0")}`,
        });
      }

      const found = await names(db, "banyak uji cari");

      expect(found).toHaveLength(10);
      expect(found[0]).toBe("Banyak Uji Cari 01");
      expect(found[9]).toBe("Banyak Uji Cari 10");
    });
  });

  it("searches for the signs % and _ as written", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      await addTestStudentAccount(db, program, {
        nim: nim(1),
        name: "Tanda Uji Cari",
      });

      expect(await searchActiveStudents(db, "%")).toEqual([]);
      expect(await searchActiveStudents(db, "_")).toEqual([]);
    });
  });
});
