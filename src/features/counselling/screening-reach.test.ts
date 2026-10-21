// Sample NIMs of this file: 9989440000 to 9989440099.
import { and, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { screenedReachOf } from "./screening-reach";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestScreening } from "./test-screenings";

const inTestDatabase = withTestDatabase();

describe("screenedReachOf", () => {
  it("lets Konselor reach only the screened students, as Daftar mahasiswa holds them", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Jangkauan Asesmen", [
        "9989440001",
        "9989440002",
      ]);
      const [screened = "", unscreened = ""] = people.studentIds;
      await addTestScreening(db, screened, people.counsellor.id);
      const reach = screenedReachOf(people.counsellor);
      if (reach === null) throw new Error("Konselor reaches nobody.");

      const found = await db
        .select({ id: students.id })
        .from(students)
        .where(and(inArray(students.id, [screened, unscreened]), reach));

      expect(found).toEqual([{ id: screened }]);
    });
  });

  it("reaches nobody for an account that does not record screenings", async () => {
    await inTestDatabase(async (db) => {
      const penilai = await addTestActor(db, "Penilai Uji Jangkauan", [
        "assessor",
      ]);
      const kepala = await addTestActor(db, "Kepala Uji Jangkauan", [
        "head_of_unit",
      ]);

      expect(screenedReachOf(penilai)).toBeNull();
      expect(screenedReachOf(kepala)).toBeNull();
    });
  });
});
