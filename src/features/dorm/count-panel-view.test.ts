// Sample Tahun akademik of this file: 2720 to 2720.
// Sample NIMs of this file: 9937740000 to 9937740099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { loadCountPanel } from "./count-panel-view";
import { readDailyActivities } from "./daily-activities";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/* Angkatan 2720 is in semester 1 in this period, so it lives in the dorm. */
const ODD_2720 = {
  startYear: 2720,
  term: "odd",
  startsOn: "2720-08-01",
  endsOn: "2721-01-31",
} as const;
const DAY = "2720-10-14";
const FROM = { startsOn: "2720-08-01" };
const AT_TEN = { day: DAY, time: "10:00" };
// 10:00 on campus on 14 October 2720.
const MOMENT = new Date("2720-10-14T03:00:00Z");

async function addResidents(db: Database) {
  await db.insert(academicPeriods).values(ODD_2720);
  const program = await addTestProgram(db, "Prodi Uji Panel Hitung");
  const student = (nim: string, name: string, more = {}) =>
    addTestStudent(db, program, { nim, name, cohortYear: 2720, ...more });
  const zahra = await student("9937740001", "Zahra Penghuni Uji");
  const ani = await student("9937740002", "Ani Penghuni Uji");
  const bayu = await student("9937740003", "Bayu Penghuni Uji", {
    sex: "male",
  });
  await student("9937740004", "Senior Uji", { cohortYear: 2719 });
  const room = await addTestRoom(db, { number: "UJI-HITUNG-1" });
  await placeTestResident(db, room, ani);
  return { zahra, ani, bayu };
}

describe("loadCountPanel", () => {
  it("is null for a day without activities", async () => {
    await inTestDatabase(async (db) => {
      expect(await loadCountPanel(db, [], DAY, null, AT_TEN)).toBeNull();
    });
  });

  it("opens on the latest started activity, and reads no one for one that has not started", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);
      const actor = await addTestActor(db, "BAM Uji Panel", ["bam_bphk"]);
      const morning = await addTestActivity(db, actor.id, {
        versions: [FROM],
      });
      const evening = await addTestActivity(db, actor.id, {
        versions: [{ ...FROM, startTime: "19:00", endTime: "21:00" }],
      });
      const activities = await readDailyActivities(db, DAY);

      const opened = await loadCountPanel(db, activities, DAY, null, AT_TEN);
      const asked = await loadCountPanel(db, activities, DAY, evening, AT_TEN);

      expect(opened?.kind).toBe("open");
      expect(opened?.activity.id).toBe(morning);
      expect(asked).toEqual({
        kind: "not_started",
        activity: expect.objectContaining({ id: evening }),
      });
    });
  });

  it("gives the residents the activity is for, by name, with their room, and the count kept", async () => {
    await inTestDatabase(async (db) => {
      const residents = await addResidents(db);
      const actor = await addTestActor(db, "BAM Uji Panel", ["bam_bphk"]);
      const forWomen = await addTestActivity(db, actor.id, {
        versions: [{ ...FROM, audience: "women" }],
      });
      await saveCount(
        db,
        actor,
        {
          activityId: forWomen,
          day: DAY,
          version: 0,
          isAnnouncement: false,
          marks: { [residents.zahra]: { isAbsent: true, note: "" } },
        },
        MOMENT,
      );
      const activities = await readDailyActivities(db, DAY);

      const opened = await loadCountPanel(db, activities, DAY, null, AT_TEN);

      if (opened?.kind !== "open") throw new Error("The count is not open.");
      expect(opened.participants).toEqual([
        {
          id: residents.ani,
          name: "Ani Penghuni Uji",
          nim: "9937740002",
          dorm: "dana_rakca",
          room: "UJI-HITUNG-1",
        },
        {
          id: residents.zahra,
          name: "Zahra Penghuni Uji",
          nim: "9937740001",
          dorm: "dana_rakca",
          room: null,
        },
      ]);
      expect(opened.kept).toMatchObject({
        version: 1,
        announcedAt: null,
        marks: {
          [residents.ani]: { isAbsent: false, note: "" },
          [residents.zahra]: { isAbsent: true, note: "" },
        },
      });
    });
  });
});
