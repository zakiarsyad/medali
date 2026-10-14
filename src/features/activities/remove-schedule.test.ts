// Sample Tahun akademik of this file: 2140 to 2140.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activitySchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeSchedule, SCHEDULE_NOT_FOUND } from "./change-schedule";
import { listSchedules } from "./list-schedules";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import { removeSchedule } from "./remove-schedule";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestSchedule,
  SENT_SCHEDULE,
  type TestActor,
} from "./test-records";

/* This file's own sample values: the Tahun akademik 2140. */

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const MAY_NOT_MANAGE = ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role));
const REMOVED = { ok: true, value: null };
const UNKNOWN_ID = "6e5d4c3b-2a1f-4e0d-9c8b-7a6f5e4d3c2b";

interface Records {
  actor: TestActor;
  /** The account that added the schedule. */
  adderId: string;
  activityId: string;
  id: string;
}

async function addRecords(
  db: Database,
  roles: RoleId[] = ["upk_staff"],
): Promise<Records> {
  const actor = await addTestActor(db, "Pegawai Uji Hapus Jadwal", roles);
  const adder = await addTestActor(db, "Pegawai Uji Penambah", ["upk_staff"]);
  const activityId = await addTestActivity(db, adder.id);
  const periods = await addTestPeriods(db, 2140);
  const id = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: adder.id,
    startsOn: "2140-09-01",
  });
  return { actor, adderId: adder.id, activityId, id };
}

async function storedOf(db: Database, id: string) {
  const [kept] = await db
    .select()
    .from(activitySchedules)
    .where(eq(activitySchedules.id, id));
  return kept;
}

async function listedIds(db: Database): Promise<string[]> {
  const list = await listSchedules(db, { kind: "ppks", level: null }, 1);
  return list.schedules.map((schedule) => schedule.id);
}

describe("removeSchedule", () => {
  it.each(MAY_MANAGE)(
    "lets %s remove a schedule: it leaves the list, and stays stored with who removed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { actor, adderId, id } = await addRecords(db, [role]);
        const before = await storedOf(db, id);
        expect(await listedIds(db)).toEqual([id]);

        const removed = await removeSchedule(db, actor, id);

        expect(removed).toEqual(REMOVED);
        expect(await listedIds(db)).toEqual([]);
        const kept = await storedOf(db, id);
        expect(kept?.deletedBy).toBe(actor.id);
        expect(kept?.deletedAt).toBeInstanceOf(Date);
        // Everything else is as it was: the mark is all a removal writes.
        expect(kept).toEqual({
          ...before,
          deletedAt: kept?.deletedAt,
          deletedBy: actor.id,
        });
        expect(kept?.changedBy).toBe(adderId);
      });
    },
  );

  it.each(MAY_NOT_MANAGE)(
    "refuses %s, who reads the tab at most, and removes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { id } = await addRecords(db);
        const reader = await addTestActor(db, "Pembaca Uji Jadwal", [role]);

        const removed = await removeSchedule(db, reader, id);

        expect(removed).toEqual(SCHEDULES_NOT_ALLOWED);
        expect((await storedOf(db, id))?.deletedAt).toBeNull();
        expect(await listedIds(db)).toEqual([id]);
      });
    },
  );

  it("removes only the schedule that is named", async () => {
    await inTestDatabase(async (db) => {
      const { actor, adderId, activityId, id } = await addRecords(db);
      const kept = await storedOf(db, id);
      if (!kept) throw new Error("The schedule is not stored.");
      const other = await addTestSchedule(db, {
        activityId,
        academicPeriodId: kept.academicPeriodId,
        changedBy: adderId,
        startsOn: "2140-09-02",
      });

      await removeSchedule(db, actor, id);

      expect(await listedIds(db)).toEqual([other]);
    });
  });

  it("still removes a schedule that someone else changed after the form was opened", async () => {
    await inTestDatabase(async (db) => {
      const { actor, activityId, id } = await addRecords(db);
      const other = await addTestActor(db, "Kepala Uji Jadwal", [
        "head_of_unit",
      ]);
      const [opened] = (
        await listSchedules(db, { kind: "ppks", level: null }, 1)
      ).schedules;
      const changed = await changeSchedule(
        db,
        other,
        id,
        opened?.version ?? "",
        {
          ...SENT_SCHEDULE,
          activityId,
          startsOn: "2140-09-10",
          endsOn: "2140-09-10",
        },
      );
      expect(changed.ok).toBe(true);

      const removed = await removeSchedule(db, actor, id);

      expect(removed).toEqual(REMOVED);
      expect(await listedIds(db)).toEqual([]);
    });
  });

  it("finds no schedule the second time, and keeps who removed it first", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id } = await addRecords(db);
      const other = await addTestActor(db, "Kepala Uji Jadwal", [
        "head_of_unit",
      ]);
      await removeSchedule(db, actor, id);
      const first = await storedOf(db, id);

      const again = await removeSchedule(db, other, id);

      expect(again).toEqual(SCHEDULE_NOT_FOUND);
      expect(await storedOf(db, id)).toEqual(first);
    });
  });

  it.each([
    ["an unknown key", UNKNOWN_ID],
    ["what is no key", "bukan-kunci"],
  ])("finds no schedule under %s", async (_kind, id) => {
    await inTestDatabase(async (db) => {
      const { actor } = await addRecords(db);

      expect(await removeSchedule(db, actor, id)).toEqual(SCHEDULE_NOT_FOUND);
    });
  });
});
