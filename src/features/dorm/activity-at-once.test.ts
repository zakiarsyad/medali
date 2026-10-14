import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { listRoutines } from "./activity-lists";
import { ACTIVITY_CHANGED_BY_OTHER } from "./activity-messages";
import { addActivity } from "./add-activity";
import { changeActivity } from "./change-activity";
import {
  addTestActivity,
  NEW_ACTIVITY_ID,
  SENT_ROUTINE,
  versionsOf,
} from "./test-activities";
import { addTestActor, type TestActor } from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * saved rows, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("kegiatanasrama");

afterEach(async () => {
  await own.db.delete(dormActivityDaysOff);
  await own.db.delete(dormActivityVersions);
  await own.db.delete(dormActivities);
  await own.db.delete(accounts);
});

const TODAY = "2026-10-14";

describe("Simpan kegiatan pressed twice at the same moment", () => {
  it("adds one activity: the second press waits for the first, then finds its activity saved", async () => {
    const manager = await addTestActor(own.db, "Pengelola Dua Kali", [
      "dorm_manager",
    ]);
    const save = (db: Database) =>
      addActivity(db, manager, NEW_ACTIVITY_ID, SENT_ROUTINE);

    const both = await own.atOnce(save, save);

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(both.sooner);
    expect(await own.db.select().from(dormActivities)).toHaveLength(1);
    expect(await own.db.select().from(dormActivityVersions)).toHaveLength(1);
  });
});

describe("two people who save a change to one activity at the same moment", () => {
  it("keep one change: the second waits for the first, then is told it has changed and overwrites nothing", async () => {
    const first = await addTestActor(own.db, "Pengelola Satu", [
      "dorm_manager",
    ]);
    const other = await addTestActor(own.db, "Pengelola Lain", [
      "dorm_manager",
    ]);
    const id = await addTestActivity(own.db, first.id);
    const [opened] = await listRoutines(own.db);
    if (!opened) throw new Error("The activity was not added.");
    const change = (actor: TestActor, location: string) => (db: Database) =>
      changeActivity(
        db,
        actor,
        id,
        opened.version,
        { ...SENT_ROUTINE, location },
        TODAY,
      );

    const both = await own.atOnce(
      change(first, "Tempat pertama"),
      change(other, "Tempat kedua"),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(ACTIVITY_CHANGED_BY_OTHER);
    const versions = await versionsOf(own.db, id);
    expect(versions.map(({ location }) => location)).toEqual([
      "Lapangan uji",
      "Tempat pertama",
    ]);
  });
});
