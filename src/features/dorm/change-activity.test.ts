import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { listOneOffs, listRoutines } from "./activity-lists";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_CHANGED_BY_OTHER,
  ACTIVITY_NOT_FOUND,
  KIND_KEPT,
  ONE_OFF_BEFORE_TODAY,
  ONE_OFF_IS_PAST,
} from "./activity-messages";
import { changeActivity } from "./change-activity";
import { readDailyActivities } from "./daily-activities";
import {
  addTestActivity,
  daysOffOf,
  SENT_ONE_OFF,
  SENT_ROUTINE,
  storedActivity,
  versionsOf,
} from "./test-activities";
import { addTestActor, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-14";
const YESTERDAY = "2026-10-13";
const ONCE_TOMORROW = {
  pattern: "once",
  startsOn: "2026-10-15",
  endsOn: "2026-10-15",
} as const;

async function manager(db: Database): Promise<TestActor> {
  return addTestActor(db, "Pengelola Ubah", ["dorm_manager"]);
}

/** The version the form of the activity opens with. */
async function versionOf(db: Database, id: string): Promise<string> {
  const routines = await listRoutines(db);
  const oneOffs = (await listOneOffs(db, 1)).activities;
  const row = [...routines, ...oneOffs].find((each) => each.id === id);
  if (!row) throw new Error("The activity is not listed.");
  return row.version;
}

function startTimes(rows: { startTime: string }[]): string[] {
  return rows.map((row) => row.startTime);
}

/** What Jadwal harian shows of a day, without how the rows are kept. */
async function shownOn(db: Database, day: string) {
  const rows = await readDailyActivities(db, day);
  return rows.map(
    ({ version, shownFrom, shownUntil, removedFrom, ...shown }) => shown,
  );
}

describe("changeActivity of a repeating activity", () => {
  it("shows the change from today on, and leaves the days before today as they showed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);
      const lastWeek = await shownOn(db, "2026-10-07");
      const yesterday = await shownOn(db, YESTERDAY);

      const changed = await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        {
          ...SENT_ROUTINE,
          name: "Apel pagi baru",
          startTime: "06:00",
          endTime: "06:30",
        },
        TODAY,
      );

      expect(changed.ok).toBe(true);
      expect(await shownOn(db, "2026-10-07")).toEqual(lastWeek);
      expect(await shownOn(db, YESTERDAY)).toEqual(yesterday);
      expect(yesterday.map((row) => [row.name, row.startTime])).toEqual([
        ["Apel pagi uji", "05:30"],
      ]);
      const today = await readDailyActivities(db, TODAY);
      expect(today.map((row) => [row.name, row.startTime])).toEqual([
        ["Apel pagi baru", "06:00"],
      ]);
      expect(startTimes(await readDailyActivities(db, "2026-11-01"))).toEqual([
        "06:00",
      ]);
    });
  });

  it("ends the version it had yesterday and keeps the new one from today, as one activity", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);

      await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        SENT_ROUTINE,
        TODAY,
      );

      const versions = await versionsOf(db, id);
      expect(versions.map((v) => [v.shownFrom, v.shownUntil])).toEqual([
        [null, YESTERDAY],
        [TODAY, null],
      ]);
      expect(await listRoutines(db)).toHaveLength(1);
      expect((await storedActivity(db, id))?.changedBy).toBe(actor.id);
    });
  });

  it("changes the version of today as it is when changed twice in one day", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);
      await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        SENT_ROUTINE,
        TODAY,
      );

      await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        { ...SENT_ROUTINE, location: "Aula uji" },
        TODAY,
      );

      const versions = await versionsOf(db, id);
      expect(versions).toHaveLength(2);
      expect(versions[1]?.location).toBe("Aula uji");
    });
  });

  it("keeps the days off of today and later that the form sends, and only those", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id, {
        daysOff: [TODAY, "2026-10-21"],
      });

      await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        { ...SENT_ROUTINE, daysOff: ["2026-10-20"] },
        TODAY,
      );

      expect(await daysOffOf(db, id)).toEqual(["2026-10-20"]);
    });
  });

  it("keeps a day off before today that the form no longer sends, so that date still shows no activity", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id, {
        daysOff: ["2026-10-01"],
      });

      const changed = await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        { ...SENT_ROUTINE, daysOff: [] },
        TODAY,
      );

      expect(changed.ok).toBe(true);
      expect(await daysOffOf(db, id)).toEqual(["2026-10-01"]);
      expect(await readDailyActivities(db, "2026-10-01")).toEqual([]);
    });
  });

  it("can still be saved with many days off gone by, and refuses more than 100 sent", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const past = Array.from({ length: 150 }, (_, place) =>
        daysAfter("2026-01-01", place),
      );
      const coming = Array.from({ length: 100 }, (_, place) =>
        daysAfter(TODAY, place),
      );
      const id = await addTestActivity(db, actor.id, {
        daysOff: [...past, ...coming],
      });
      const opened = await versionOf(db, id);

      const tooMany = await changeActivity(
        db,
        actor,
        id,
        opened,
        { ...SENT_ROUTINE, daysOff: [...coming, "2027-12-31"] },
        TODAY,
      );
      const saved = await changeActivity(
        db,
        actor,
        id,
        opened,
        { ...SENT_ROUTINE, daysOff: coming },
        TODAY,
      );

      expect(tooMany).toEqual({
        ok: false,
        error:
          "Hari tanpa kegiatan yang dikirim sekaligus paling banyak 100 tanggal.",
      });
      expect(saved.ok).toBe(true);
      expect(await daysOffOf(db, id)).toHaveLength(250);
    });
  });

  it("refuses a hand-made request with more days off than one form sends, and keeps the days off as they were", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id, {
        daysOff: ["2026-10-01"],
      });
      const flood = Array.from({ length: 40_000 }, (_, place) =>
        daysAfter("1900-01-01", place),
      );

      const changed = await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        { ...SENT_ROUTINE, daysOff: flood },
        TODAY,
      );

      expect(changed).toEqual({
        ok: false,
        error:
          "Hari tanpa kegiatan yang dikirim sekaligus paling banyak 100 tanggal.",
      });
      expect(await daysOffOf(db, id)).toEqual(["2026-10-01"]);
    });
  });

  it("refuses to make it a one-off activity", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);

      const changed = await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        { ...SENT_ONE_OFF, day: TODAY },
        TODAY,
      );

      expect(changed).toEqual(KIND_KEPT);
    });
  });
});

describe("changeActivity of a one-off activity", () => {
  it("changes it as it is while its day is today or later", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id, {
        versions: [ONCE_TOMORROW],
      });

      const changed = await changeActivity(
        db,
        actor,
        id,
        await versionOf(db, id),
        { ...SENT_ONE_OFF, day: "2026-10-16" },
        TODAY,
      );

      expect(changed.ok).toBe(true);
      const versions = await versionsOf(db, id);
      expect(versions.map((v) => [v.startsOn, v.shownFrom])).toEqual([
        ["2026-10-16", null],
      ]);
    });
  });

  it("refuses to change one whose day has gone by, or to move one to a day gone by", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const past = { ...ONCE_TOMORROW, startsOn: YESTERDAY, endsOn: YESTERDAY };
      const pastId = await addTestActivity(db, actor.id, { versions: [past] });
      const comingId = await addTestActivity(db, actor.id, {
        versions: [ONCE_TOMORROW],
      });

      const onPast = await changeActivity(
        db,
        actor,
        pastId,
        await versionOf(db, pastId),
        { ...SENT_ONE_OFF, day: "2026-10-20" },
        TODAY,
      );
      const toPast = await changeActivity(
        db,
        actor,
        comingId,
        await versionOf(db, comingId),
        { ...SENT_ONE_OFF, day: YESTERDAY },
        TODAY,
      );

      expect(onPast).toEqual(ONE_OFF_IS_PAST);
      expect(toPast).toEqual(ONE_OFF_BEFORE_TODAY);
      expect((await versionsOf(db, pastId))[0]?.startsOn).toBe(YESTERDAY);
    });
  });
});

describe("changeActivity refuses", () => {
  it("a form opened before someone else's change, whatever else is wrong in it, and overwrites nothing", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);
      const opened = await versionOf(db, id);
      await changeActivity(db, actor, id, opened, SENT_ROUTINE, TODAY);

      const late = await changeActivity(
        db,
        actor,
        id,
        opened,
        { ...SENT_ROUTINE, name: "Ab", location: "Tempat telat" },
        TODAY,
      );

      expect(late).toEqual(ACTIVITY_CHANGED_BY_OTHER);
      expect(late).toEqual({
        ok: false,
        error: "Kegiatan sudah diubah orang lain. Muat ulang.",
      });
      const versions = await versionsOf(db, id);
      expect(versions.map((v) => v.location)).not.toContain("Tempat telat");
    });
  });

  it.each(["", "kemarin", "2026-10-13"])(
    "a version %j this app did not make",
    async (version) => {
      await inTestDatabase(async (db) => {
        const actor = await manager(db);
        const id = await addTestActivity(db, actor.id);

        expect(
          await changeActivity(db, actor, id, version, SENT_ROUTINE, TODAY),
        ).toEqual(ACTIVITY_CHANGED_BY_OTHER);
      });
    },
  );

  it("an activity that is not there", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const missing = "00000000-0000-4000-8000-00000000ffff";

      expect(
        await changeActivity(db, actor, missing, "", SENT_ROUTINE, TODAY),
      ).toEqual(ACTIVITY_NOT_FOUND);
      expect(
        await changeActivity(db, actor, "satu", "", SENT_ROUTINE, TODAY),
      ).toEqual(ACTIVITY_NOT_FOUND);
    });
  });

  it.each(["bam_household", "bam_compliance", "director", "student"] as const)(
    "a hand-made change by %s, who may not manage the activities",
    async (role) => {
      await inTestDatabase(async (db) => {
        const owner = await manager(db);
        const id = await addTestActivity(db, owner.id);
        const actor = await addTestActor(db, "Bukan Pengelola", [role]);

        const changed = await changeActivity(
          db,
          actor,
          id,
          await versionOf(db, id),
          { ...SENT_ROUTINE, location: "Tempat liar" },
          TODAY,
        );

        expect(changed).toEqual(ACTIVITIES_NOT_ALLOWED);
        expect(await versionsOf(db, id)).toHaveLength(1);
      });
    },
  );
});
