import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { removeActivity } from "./remove-activity";
import { readResidentActivities } from "./resident-activities";
import { addTestActivity } from "./test-activities";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 2067 is in semester 1 in it.
 */
const ODD_2067 = {
  startYear: 2067,
  term: "odd",
  startsOn: "2067-08-01",
  endsOn: "2068-01-31",
} as const;
// 10:00 on campus on Wednesday 12 October 2067.
const MOMENT = new Date("2067-10-12T03:00:00Z");
const TODAY = "2067-10-12";
const FROM = { startsOn: "2067-08-01" };

interface Residents {
  /** A Reguler woman of semester 1: she lives in Dana Rakca. */
  woman: string;
  /** A Reguler woman of semester 3: she lives in no dorm. */
  senior: string;
}

async function addResidents(db: Database): Promise<Residents> {
  await db.insert(academicPeriods).values(ODD_2067);
  const program = await addTestProgram(db, "Prodi Uji Kegiatan Penghuni");
  const woman = await addTestStudent(db, program, {
    nim: "9936670001",
    name: "Penghuni Uji",
    cohortYear: 2067,
  });
  const senior = await addTestStudent(db, program, {
    nim: "9936670002",
    name: "Senior Uji",
    cohortYear: 2066,
  });
  return { woman, senior };
}

function studentAccount(
  studentId: string | null,
  roles: RoleId[] = ["student"],
) {
  return { roles, studentId };
}

describe("readResidentActivities", () => {
  it("gives a resident the activities of today and the next six, of those for every resident, for the women and for their dorm", async () => {
    await inTestDatabase(async (db) => {
      const { woman } = await addResidents(db);
      const by = (await addTestActor(db, "Pengelola", ["dorm_manager"])).id;
      for (const audience of ["all", "women", "dana_rakca"] as const) {
        await addTestActivity(db, by, {
          versions: [{ ...FROM, name: `Untuk ${audience}`, audience }],
        });
      }
      for (const audience of [
        "men",
        "cipta_bakti",
        "wismantara_putri",
      ] as const) {
        await addTestActivity(db, by, {
          versions: [{ ...FROM, name: `Bukan ${audience}`, audience }],
        });
      }

      const answer = await readResidentActivities(
        db,
        studentAccount(woman),
        MOMENT,
      );

      if (answer.kind !== "shown") throw new Error("The resident was refused.");
      const { today, coming, dorm, now } = answer.activities;
      expect(dorm).toBe("dana_rakca");
      expect(now).toEqual({ day: TODAY, time: "10:00" });
      expect(today.map((row) => row.name).sort()).toEqual([
        "Untuk all",
        "Untuk dana_rakca",
        "Untuk women",
      ]);
      expect(coming).toHaveLength(6);
      expect(coming.map(({ day }) => day)).toEqual([
        "2067-10-13",
        "2067-10-13",
        "2067-10-13",
        "2067-10-14",
        "2067-10-14",
        "2067-10-14",
      ]);
      for (const { activity } of coming) {
        expect(activity.name.startsWith("Untuk")).toBe(true);
      }
    });
  });

  it("leaves out an activity removed today, and a day off", async () => {
    await inTestDatabase(async (db) => {
      const { woman } = await addResidents(db);
      const manager = await addTestActor(db, "Pengelola", ["dorm_manager"]);
      const removed = await addTestActivity(db, manager.id, {
        versions: [{ ...FROM, name: "Dihapus" }],
      });
      await removeActivity(db, manager, removed, TODAY);
      await addTestActivity(db, manager.id, {
        versions: [{ ...FROM, name: "Libur hari ini" }],
        daysOff: [TODAY],
      });

      const answer = await readResidentActivities(
        db,
        studentAccount(woman),
        MOMENT,
      );

      if (answer.kind !== "shown") throw new Error("The resident was refused.");
      expect(answer.activities.today).toEqual([]);
      expect(answer.activities.coming[0]?.activity.name).toBe("Libur hari ini");
    });
  });

  it("refuses a student who does not live in the dorm", async () => {
    await inTestDatabase(async (db) => {
      const { senior } = await addResidents(db);

      expect(
        await readResidentActivities(db, studentAccount(senior), MOMENT),
      ).toEqual({ kind: "refused" });
    });
  });

  it("refuses Pengasuh, who has no right to the dorm activities, and an account that is no student", async () => {
    await inTestDatabase(async (db) => {
      const { woman } = await addResidents(db);

      expect(
        await readResidentActivities(
          db,
          studentAccount(woman, ["mentor"]),
          MOMENT,
        ),
      ).toEqual({ kind: "refused" });
      expect(
        await readResidentActivities(db, studentAccount(null), MOMENT),
      ).toEqual({ kind: "refused" });
    });
  });
});
