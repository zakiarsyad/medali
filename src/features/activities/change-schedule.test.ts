// Sample Tahun akademik of this file: 2130 to 2130.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activitySchedules, ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  changeSchedule,
  SCHEDULE_CHANGED_BY_OTHER,
  SCHEDULE_NOT_FOUND,
} from "./change-schedule";
import { listSchedules } from "./list-schedules";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import { NO_ACTIVITY, type SentSchedule } from "./schedule-input";
import { BEFORE_FIRST_PERIOD } from "./schedule-place";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestSchedule,
  SENT_SCHEDULE,
  type TestActor,
  type TestPeriods,
} from "./test-records";

/* This file's own sample values: the Tahun akademik 2130. */

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const MAY_NOT_MANAGE = ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role));
const CHANGED = {
  ok: true,
  value: { name: "Kegiatan uji jadwal", semester: 3 },
};
const UNKNOWN_ID = "6e5d4c3b-2a1f-4e0d-9c8b-7a6f5e4d3c2b";

interface Records {
  actor: TestActor;
  periods: TestPeriods;
  /** The stored schedule: one morning in Ganjil 2130, of the activity. */
  id: string;
  /** The version a form opened now would hold. */
  version: string;
  /** What a form sends to change every part but the activity. */
  sent: SentSchedule;
}

async function versionOfStored(db: Database, id: string): Promise<string> {
  const list = await listSchedules(db, null, 1);
  const opened = list.schedules.find((schedule) => schedule.id === id);
  if (!opened) throw new Error("The schedule is not in the list.");
  return opened.version;
}

async function addRecords(
  db: Database,
  roles: RoleId[] = ["upk_staff"],
): Promise<Records> {
  const actor = await addTestActor(db, "Pegawai Uji Ubah Jadwal", roles);
  const adder = await addTestActor(db, "Pegawai Uji Penambah", ["upk_staff"]);
  const activityId = await addTestActivity(db, adder.id);
  const periods = await addTestPeriods(db, 2130);
  const id = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: adder.id,
    startsOn: "2130-09-01",
    // A moment that is over, so the first change is told from it.
    changedAt: new Date("2130-01-01T00:00:00.000Z"),
  });
  const sent: SentSchedule = {
    ...SENT_SCHEDULE,
    activityId,
    startsOn: "2130-10-05",
    endsOn: "2130-10-06",
    startTime: "13:00",
    endTime: "15:30",
    uploadCount: "2",
    uploadUnit: "week",
    location: "Lapangan uji",
    isRequired: false,
  };
  return { actor, periods, id, version: await versionOfStored(db, id), sent };
}

async function storedOf(db: Database, id: string) {
  const [kept] = await db
    .select()
    .from(activitySchedules)
    .where(eq(activitySchedules.id, id));
  if (!kept) throw new Error("The schedule is not stored.");
  return kept;
}

describe("changeSchedule", () => {
  it.each(MAY_MANAGE)(
    "lets %s change every part, kept with who changed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { actor, periods, id, version, sent } = await addRecords(db, [
          role,
        ]);

        const changed = await changeSchedule(db, actor, id, version, sent);

        expect(changed).toEqual(CHANGED);
        const kept = await storedOf(db, id);
        expect(kept).toMatchObject({
          activityId: sent.activityId,
          academicPeriodId: periods.oddId,
          startsOn: "2130-10-05",
          endsOn: "2130-10-06",
          startTime: "13:00:00",
          endTime: "15:30:00",
          uploadCount: 2,
          uploadUnit: "week",
          location: "Lapangan uji",
          isRequired: false,
          changedBy: actor.id,
          deletedAt: null,
        });
        expect(await versionOfStored(db, id)).not.toBe(version);
      });
    },
  );

  it.each(MAY_NOT_MANAGE)(
    "refuses %s, who reads the tab at most, and changes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { id, version, sent } = await addRecords(db);
        const reader = await addTestActor(db, "Pembaca Uji Jadwal", [role]);
        const before = await storedOf(db, id);

        const changed = await changeSchedule(db, reader, id, version, sent);

        expect(changed).toEqual(SCHEDULES_NOT_ALLOWED);
        expect(await storedOf(db, id)).toEqual(before);
      });
    },
  );

  it("refuses a form with a fault in it, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const before = await storedOf(db, id);

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        endsOn: "2130-10-04",
      });

      expect(changed).toEqual({
        ok: false,
        error: "Tanggal selesai harus sama atau setelah tanggal mulai.",
      });
      expect(await storedOf(db, id)).toEqual(before);
    });
  });

  it.each([
    ["an unknown key", UNKNOWN_ID],
    ["what is no key", "bukan-kunci"],
  ])("finds no schedule under %s", async (_kind, id) => {
    await inTestDatabase(async (db) => {
      const { actor, version, sent } = await addRecords(db);

      const changed = await changeSchedule(db, actor, id, version, sent);

      expect(changed).toEqual(SCHEDULE_NOT_FOUND);
    });
  });

  it("finds no schedule once it was removed, and leaves it as it was", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      await db
        .update(activitySchedules)
        .set({ deletedAt: new Date(), deletedBy: actor.id })
        .where(eq(activitySchedules.id, id));
      const before = await storedOf(db, id);

      const changed = await changeSchedule(db, actor, id, version, sent);

      expect(changed).toEqual(SCHEDULE_NOT_FOUND);
      expect(await storedOf(db, id)).toEqual(before);
    });
  });
});

describe("the academic period of a changed schedule", () => {
  it("becomes the one that runs on its new first day", async () => {
    await inTestDatabase(async (db) => {
      const { actor, periods, id, version, sent } = await addRecords(db);

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        startsOn: "2131-04-10",
        endsOn: "2131-04-10",
      });

      expect(changed).toEqual(CHANGED);
      expect((await storedOf(db, id)).academicPeriodId).toBe(periods.evenId);
    });
  });

  it("is the one that ended last when the new first day is between two periods", async () => {
    await inTestDatabase(async (db) => {
      const { actor, periods, id, sent } = await addRecords(db);
      await db
        .update(activitySchedules)
        .set({
          academicPeriodId: periods.evenId,
          startsOn: "2131-04-10",
          endsOn: "2131-04-10",
        })
        .where(eq(activitySchedules.id, id));
      const version = await versionOfStored(db, id);

      await changeSchedule(db, actor, id, version, {
        ...sent,
        startsOn: "2131-02-14",
        endsOn: "2131-02-14",
      });

      expect((await storedOf(db, id)).academicPeriodId).toBe(periods.oddId);
    });
  });

  it("is none before the first stored period: the change is refused and nothing is overwritten", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const before = await storedOf(db, id);

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        startsOn: "2130-07-31",
        endsOn: "2130-08-01",
      });

      expect(changed).toEqual(BEFORE_FIRST_PERIOD);
      expect(await storedOf(db, id)).toEqual(before);
    });
  });
});

describe("a schedule changed by two people from the same version", () => {
  it("keeps the first change: the second is told it has changed and overwrites nothing", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const other = await addTestActor(db, "Kepala Uji Jadwal", [
        "head_of_unit",
      ]);

      const first = await changeSchedule(db, actor, id, version, {
        ...sent,
        location: "Tempat pertama",
      });
      const second = await changeSchedule(db, other, id, version, {
        ...sent,
        location: "Tempat kedua",
      });

      expect(first).toEqual(CHANGED);
      expect(second).toEqual(SCHEDULE_CHANGED_BY_OTHER);
      const kept = await storedOf(db, id);
      expect(kept.location).toBe("Tempat pertama");
      expect(kept.changedBy).toBe(actor.id);
    });
  });

  it.each([
    ["a last day before the first", { endsOn: "2130-10-04" }],
    ["hours out of order", { endTime: "13:00" }],
    ["no activity", { activityId: "" }],
    ["an upload range out of its limits", { uploadCount: "99" }],
  ])(
    "tells the second it has changed before it names %s in their form",
    async (_kind, fault) => {
      await inTestDatabase(async (db) => {
        const { actor, id, version, sent } = await addRecords(db);
        const other = await addTestActor(db, "Kepala Uji Jadwal", [
          "head_of_unit",
        ]);
        await changeSchedule(db, actor, id, version, sent);
        const before = await storedOf(db, id);

        const second = await changeSchedule(db, other, id, version, {
          ...sent,
          ...fault,
        });

        expect(second).toEqual(SCHEDULE_CHANGED_BY_OTHER);
        expect(await storedOf(db, id)).toEqual(before);
      });
    },
  );

  it("names the fault in a form that holds the newest version", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        endTime: "13:00",
      });

      expect(changed).toEqual({
        ok: false,
        error: "Jam selesai harus setelah jam mulai.",
      });
    });
  });

  it("says the schedule is gone, not what is wrong in the form, once someone else removed it", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      await db
        .update(activitySchedules)
        .set({ deletedAt: new Date(), deletedBy: actor.id })
        .where(eq(activitySchedules.id, id));

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        endsOn: "2130-10-04",
      });

      expect(changed).toEqual(SCHEDULE_NOT_FOUND);
    });
  });

  it("lets the second through once their form holds the new version", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      await changeSchedule(db, actor, id, version, sent);
      const newest = await versionOfStored(db, id);

      const again = await changeSchedule(db, actor, id, newest, {
        ...sent,
        location: "Tempat kedua",
      });

      expect(again).toEqual(CHANGED);
      expect((await storedOf(db, id)).location).toBe("Tempat kedua");
    });
  });

  it("gives every change a version of its own, also two within one moment", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const versions = [version];

      for (let turn = 0; turn < 3; turn += 1) {
        const opened = versions.at(-1) ?? "";
        await changeSchedule(db, actor, id, opened, sent);
        versions.push(await versionOfStored(db, id));
      }

      expect(new Set(versions).size).toBe(4);
    });
  });

  it.each(["", "kemarin", "2130-01-01"])(
    "takes the version %j as an old one, and overwrites nothing",
    async (version) => {
      await inTestDatabase(async (db) => {
        const { actor, id, sent } = await addRecords(db);
        const before = await storedOf(db, id);

        const changed = await changeSchedule(db, actor, id, version, sent);

        expect(changed).toEqual(SCHEDULE_CHANGED_BY_OTHER);
        expect(await storedOf(db, id)).toEqual(before);
      });
    },
  );
});

describe("the activity of a changed schedule", () => {
  async function removeFromList(db: Database, activityId: string, by: string) {
    await db
      .update(ppksActivities)
      .set({ deletedAt: new Date(), deletedBy: by })
      .where(eq(ppksActivities.id, activityId));
  }

  it("may be another one that is in the Kurikulum list", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const other = await addTestActivity(db, actor.id, {
        semester: 5,
        name: "Kegiatan uji lain",
      });

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        activityId: other,
      });

      expect(changed).toEqual({
        ok: true,
        value: { name: "Kegiatan uji lain", semester: 5 },
      });
      expect((await storedOf(db, id)).activityId).toBe(other);
    });
  });

  it("stays the one it holds after that was removed from Kurikulum", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      await removeFromList(db, sent.activityId, actor.id);

      const changed = await changeSchedule(db, actor, id, version, sent);

      expect(changed).toEqual(CHANGED);
      const kept = await storedOf(db, id);
      expect(kept.activityId).toBe(sent.activityId);
      expect(kept.location).toBe("Lapangan uji");
    });
  });

  it("may not become another one that was removed from Kurikulum", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const removed = await addTestActivity(db, actor.id, {
        name: "Kegiatan uji dihapus",
      });
      await removeFromList(db, removed, actor.id);
      const before = await storedOf(db, id);

      const changed = await changeSchedule(db, actor, id, version, {
        ...sent,
        activityId: removed,
      });

      expect(changed).toEqual(NO_ACTIVITY);
      expect(await storedOf(db, id)).toEqual(before);
    });
  });

  it("may not become a special or additional activity, or one that is not stored", async () => {
    await inTestDatabase(async (db) => {
      const { actor, id, version, sent } = await addRecords(db);
      const special = await addTestActivity(db, actor.id, {
        semester: null,
        name: "Kegiatan khusus uji",
      });

      for (const activityId of [special, UNKNOWN_ID]) {
        const changed = await changeSchedule(db, actor, id, version, {
          ...sent,
          activityId,
        });

        expect(changed).toEqual(NO_ACTIVITY);
      }
    });
  });
});
