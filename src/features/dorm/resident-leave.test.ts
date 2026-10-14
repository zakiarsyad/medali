// Sample Tahun akademik of this file: 2870 to 2870.
// Sample NIMs of this file: 9937840000 to 9937840099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { askLeave } from "./ask-leave";
import { describeLeave } from "./describe-leave";
import { LEAVE_OVERLAPS } from "./leave-messages";
import { readOwnLeave } from "./own-leave";
import { addTestActivity } from "./test-activities";
import { addTestResidents, sentOuting, type TestResident } from "./test-leave";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2870.
const MOMENT = new Date("2870-10-12T03:00:00Z");

async function addRecords(db: Database) {
  const [ani, bea] = await addTestResidents(
    db,
    2870,
    "Prodi Uji Riwayat Izin",
    ["9937840001", "9937840002"],
  );
  if (!ani || !bea) throw new Error("The residents were not added.");
  const manager = await addTestActor(db, "Pengelola Uji Izin", [
    "dorm_manager",
  ]);
  // Every day from 19:30 to 21:00, for every resident.
  await addTestActivity(db, manager.id, {
    versions: [
      {
        name: "Belajar malam uji",
        startsOn: "2870-08-01",
        startTime: "19:30",
        endTime: "21:00",
      },
    ],
  });
  return { ani, bea };
}

async function ask(
  db: Database,
  who: TestResident,
  more: Parameters<typeof sentOuting>[1] & { day: string },
) {
  const { day, ...sent } = more;
  const saved = await askLeave(
    db,
    who,
    crypto.randomUUID(),
    sentOuting(day, sent),
    MOMENT,
  );
  if (!saved.ok) throw new Error(saved.error);
}

describe("readOwnLeave", () => {
  it("shows only the resident's own requests, the latest start first, an ITMK with the activities it covers", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea } = await addRecords(db);
      await ask(db, ani, { day: "2870-10-13" });
      await ask(db, ani, {
        day: "2870-10-14",
        kind: "skip_activities",
        startsAt: "2870-10-14T19:00",
        endsAt: "2870-10-14T21:30",
      });
      await ask(db, bea, { day: "2870-10-15" });

      const answer = await readOwnLeave(db, ani, 1, MOMENT);

      if (answer.kind !== "shown") throw new Error("It was refused.");
      expect(answer.leave.dorm).toBe("dana_rakca");
      expect(answer.leave.matching).toBe(2);
      expect(answer.leave.rows.map((row) => row.kind)).toEqual([
        "skip_activities",
        "outing",
      ]);
      const [skipping, outing] = answer.leave.rows;
      expect(skipping?.covered.map((each) => each.name)).toEqual([
        "Belajar malam uji",
      ]);
      expect(skipping?.start).toBe("14 Okt 2870, 19.00");
      expect(outing).toMatchObject({
        status: "submitted",
        length: "7 jam",
        covered: [],
      });
    });
  });

  it("refuses a role that may not ask, and a student who lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      expect(
        await readOwnLeave(db, { ...ani, roles: ["bam_bphk"] }, 1, MOMENT),
      ).toEqual({ kind: "refused" });
      // Angkatan 2869 is in semester 3 then: it lives in no dorm.
      await db
        .update(students)
        .set({ cohortYear: 2869 })
        .where(eq(students.id, ani.studentId));
      expect(await readOwnLeave(db, ani, 1, MOMENT)).toEqual({
        kind: "refused",
      });
    });
  });
});

describe("describeLeave", () => {
  it("names the activities an ITMK covers, with its length", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const note = await describeLeave(
        db,
        ani,
        {
          kind: "skip_activities",
          startsAt: "2870-10-13T19:00",
          endsAt: "2870-10-14T20:00",
        },
        MOMENT,
      );

      expect(note).toEqual({
        words:
          "Durasi 25 jam, melewati malam. Kegiatan asrama yang tidak diikuti dan akan tercatat hadir (ITMK): Belajar malam uji 13 Okt 2870 19:30, Belajar malam uji 14 Okt 2870 19:30.",
        isProblem: false,
      });
    });
  });

  it("says when the times overlap another request of theirs", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      await ask(db, ani, { day: "2870-10-13" });

      const note = await describeLeave(
        db,
        ani,
        {
          kind: "outing",
          startsAt: "2870-10-13T15:00",
          endsAt: "2870-10-13T18:00",
        },
        MOMENT,
      );

      expect(note).toEqual({
        words: `Durasi 3 jam. ${LEAVE_OVERLAPS.error}`,
        isProblem: true,
      });
    });
  });

  it("says nothing while a time is missing, or to a role that may not ask", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const times = {
        kind: "outing",
        startsAt: "2870-10-13T09:00",
        endsAt: "2870-10-13T10:00",
      };

      expect(
        await describeLeave(db, ani, { ...times, endsAt: "" }, MOMENT),
      ).toBeNull();
      expect(
        await describeLeave(db, { ...ani, roles: ["dorm_manager"] }, times),
      ).toBeNull();
    });
  });
});
