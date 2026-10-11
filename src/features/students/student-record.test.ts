import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";

const inTestDatabase = withTestDatabase();

async function addProgram(db: Database, name: string): Promise<number> {
  const [program] = await db.insert(studyPrograms).values({ name }).returning();
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
});
