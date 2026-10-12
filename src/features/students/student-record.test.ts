import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accounts, students, studyPrograms } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";

const inTestDatabase = withTestDatabase();

async function addProgram(db: Database, name: string): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name, code: name })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

describe("a student record", () => {
  it("keeps every field the prototype shows", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db, "Prodi Uji Rekam");
      const record = {
        nim: "9900000001",
        name: "Mahasiswa Uji",
        studyProgramId,
        entryPath: "transfer" as const,
        sex: "female" as const,
        cohortYear: 2025,
        className: "1-01",
        province: "Jawa Barat",
        originAgency: "Instansi Uji",
        isAffirmation: true,
        isSeedling: true,
        isInternational: true,
        isBlended: true,
        status: "on_leave" as const,
      };
      await db.insert(students).values(record);

      const [kept] = await db
        .select()
        .from(students)
        .where(eq(students.nim, record.nim));

      expect(kept).toMatchObject(record);
    });
  });

  it.each(["active", "on_leave", "inactive"] as const)(
    "takes the status %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const studyProgramId = await addProgram(db, "Prodi Uji Status");
        const [kept] = await db
          .insert(students)
          .values({
            nim: "9900000002",
            name: "Mahasiswa Uji",
            studyProgramId,
            entryPath: "regular",
            sex: "male",
            cohortYear: 2024,
            status,
          })
          .returning();
        expect(kept?.status).toBe(status);
      });
    },
  );

  it("keeps who put it in, when and how, and a removal mark", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db, "Prodi Uji Tanda");
      const [staff] = await db
        .insert(accounts)
        .values({ name: "Pegawai Uji" })
        .returning();
      if (!staff) throw new Error("The account was not added.");
      const marks = {
        inputAt: new Date("2026-10-11T03:00:00Z"),
        inputBy: staff.id,
        inputSource: "form" as const,
        deletedAt: new Date("2026-10-12T03:00:00Z"),
        deletedBy: staff.id,
      };

      const [kept] = await db
        .insert(students)
        .values({
          nim: "9900000003",
          name: "Mahasiswa Uji",
          studyProgramId,
          entryPath: "regular",
          sex: "female",
          cohortYear: 2026,
          ...marks,
        })
        .returning();

      expect(kept).toMatchObject(marks);
    });
  });

  it("has no such marks unless they are given", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db, "Prodi Uji Tanpa Tanda");
      const [kept] = await db
        .insert(students)
        .values({
          nim: "9900000004",
          name: "Mahasiswa Uji",
          studyProgramId,
          entryPath: "regular",
          sex: "male",
          cohortYear: 2026,
        })
        .returning();

      expect(kept).toMatchObject({
        inputAt: null,
        inputBy: null,
        inputSource: null,
        deletedAt: null,
        deletedBy: null,
      });
    });
  });
});
