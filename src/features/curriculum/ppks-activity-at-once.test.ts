import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accounts, ppksActivities } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addPpksActivity } from "./add-ppks-activity";
import {
  ACTIVITY_CHANGED_BY_OTHER,
  changePpksActivity,
} from "./change-ppks-activity";
import { readPpksActivities } from "./stored-ppks-activities";
import {
  addTestActor,
  NEW_ACTIVITY_ID,
  SENT_SPECIAL_ACTIVITY,
} from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * saved activity, so these checks have a database of their own, dropped
 * at the end.
 */
const own = withOwnTestDatabase("kegiatan");

afterEach(async () => {
  await own.db.delete(ppksActivities);
  await own.db.delete(accounts);
});

describe("Simpan of a new activity pressed twice at the same moment", () => {
  it("adds one activity: the second press waits for the first, then finds its activity saved", async () => {
    const actor = await addTestActor(own.db, "Pegawai Dua Kali", ["upk_staff"]);

    const both = await own.atOnce(
      (db) =>
        addPpksActivity(db, actor, NEW_ACTIVITY_ID, SENT_SPECIAL_ACTIVITY),
      (db) =>
        addPpksActivity(db, actor, NEW_ACTIVITY_ID, SENT_SPECIAL_ACTIVITY),
    );

    const added = { ok: true, value: "Kegiatan uji" };
    expect(both.sooner).toEqual(added);
    expect(both.later).toEqual(added);
    expect(await own.db.select().from(ppksActivities)).toHaveLength(1);
  });
});

describe("two staff who save a change to one activity at the same moment", () => {
  it("keep one change: the second waits for the first, then is refused and overwrites nothing", async () => {
    const adder = await addTestActor(own.db, "Pegawai Satu", ["upk_staff"]);
    const other = await addTestActor(own.db, "Kepala Dua", ["head_of_unit"]);
    await addPpksActivity(
      own.db,
      adder,
      NEW_ACTIVITY_ID,
      SENT_SPECIAL_ACTIVITY,
    );
    const [opened] = await readPpksActivities(own.db);
    if (!opened) throw new Error("The activity was not added.");
    const change = (actor: typeof adder, name: string) => (db: Database) =>
      changePpksActivity(db, actor, NEW_ACTIVITY_ID, opened.version, {
        ...SENT_SPECIAL_ACTIVITY,
        name,
      });

    const both = await own.atOnce(
      change(adder, "Kegiatan uji pertama"),
      change(other, "Kegiatan uji kedua"),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Kegiatan uji pertama" });
    expect(both.later).toEqual(ACTIVITY_CHANGED_BY_OTHER);
    const kept = await own.db.select().from(ppksActivities);
    expect(kept.map(({ name }) => name)).toEqual(["Kegiatan uji pertama"]);
    expect(kept[0]?.changedBy).toBe(adder.id);
  });
});
