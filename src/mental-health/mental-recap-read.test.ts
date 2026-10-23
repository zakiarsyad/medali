// Sample NIMs of this file: 9914000000 to 9914000099.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingSharingReads, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestScreening } from "@/features/counselling/test-screenings";
import { addConsentedPeople } from "@/features/counselling/test-sessions";
import { publishTestSharing } from "@/features/counselling/test-shared";
import { readPublishedRows } from "./mental-recap-read";
import { sharedReachOf } from "./shared-reach";

const inTestDatabase = withTestDatabase();

const NOW = new Date("2026-10-22T03:00:00Z");

describe("readPublishedRows", () => {
  it("gives the rows published to the reader among the students given, and logs each row shown", async () => {
    await inTestDatabase(async (db) => {
      const people = await addConsentedPeople(db, "Prodi Uji Baris Publikasi", [
        "9914000001",
        "9914000002",
      ]);
      const [first, second] = people.studentIds;
      if (first === undefined || second === undefined) {
        throw new Error("No students were added.");
      }
      for (const studentId of [first, second]) {
        await addTestScreening(db, studentId, people.counsellor.id, {
          level: "moderate",
        });
        await publishTestSharing(
          db,
          { ...people, studentId },
          { data: ["level"], recipients: ["head_of_unit"] },
        );
      }
      const head = { ...people.counsellor, roles: ["head_of_unit" as const] };
      const reach = sharedReachOf(head);
      if (reach === null) throw new Error("Kepala Unit reads no sharing.");

      const rows = await readPublishedRows(
        db,
        inArray(students.id, [first]),
        { readerId: head.id, reach },
        NOW,
      );

      expect(rows.map((row) => [row.name, row.level])).toEqual([
        ["Mahasiswa Uji Konseling 1", "moderate"],
      ]);
      const logged = await db
        .select({ studentId: counsellingSharingReads.studentId })
        .from(counsellingSharingReads)
        .where(eq(counsellingSharingReads.readBy, head.id));
      expect(logged).toEqual([{ studentId: first }]);
    });
  });
});
