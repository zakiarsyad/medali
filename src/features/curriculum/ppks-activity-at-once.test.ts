import { afterEach, describe, expect, it } from "vitest";
import { accounts, ppksActivities } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addPpksActivity } from "./add-ppks-activity";
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
