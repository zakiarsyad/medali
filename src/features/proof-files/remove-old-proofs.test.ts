// Sample Tahun akademik of this file: 3401 to 3401.
import { eq, inArray, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activitySchedules, proofFileRemovals } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestPeriods } from "@/features/activities/test-records";
import type { FileStore } from "@/files/file-store";
import { type MemoryStore, memoryStore } from "@/files/memory-store";
import { NOT_ALLOWED } from "./not-allowed";
import { PROOF_KINDS, type ProofKind } from "./proof-kinds";
import { PROOF_SOURCES } from "./proof-sources";
import {
  NO_STORAGE_REFUSAL,
  NOT_SET_REFUSAL,
  removeOldProofs,
  STOPPED_REFUSAL,
} from "./remove-old-proofs";
import { saveKeepDays } from "./save-keep-days";
import {
  addProofSetting,
  addTestProofs,
  type ProofSetting,
  removeSchedulesOf,
  type TestProofs,
} from "./test-proofs";
import { addTestActor } from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 3401, the program
 * UJIBERKASHAPUS and the NIMs 9989510000 to 9989510099.
 */

const inTestDatabase = withTestDatabase();

/** In the odd period of 3401, which ends on 31 January 3402. */
const SENT_AT = new Date("3401-09-10T03:00:00Z");

/** Long after that period ended. */
const NOW = new Date("3402-06-01T03:00:00Z");

interface Setting {
  actor: { id: string; roles: ["head_of_unit"] };
  proofSetting: ProofSetting;
  old: TestProofs;
  waiting: TestProofs;
  store: MemoryStore;
}

/** Files of every kind, decided and waiting, kept in `store`, with no days set. */
async function addSetting(db: Database, nim: string): Promise<Setting> {
  const { oddId } = await addTestPeriods(db, 3401);
  const setting = await addProofSetting(db, oddId, "UJIBERKASHAPUS", nim);
  const store = memoryStore();
  const old = await addTestProofs(db, setting, SENT_AT, true, store);
  const waiting = await addTestProofs(db, setting, SENT_AT, false, store);
  const added = await addTestActor(db, "Kepala Uji Hapus", ["head_of_unit"]);
  return {
    actor: { id: added.id, roles: ["head_of_unit"] },
    proofSetting: setting,
    old,
    waiting,
    store,
  };
}

/** The same, with 30 days set. */
async function addSettingWithDays(db: Database, nim: string): Promise<Setting> {
  const setting = await addSetting(db, nim);
  await saveKeepDays(db, setting.actor, "30");
  return setting;
}

interface StoredRecord {
  status: string;
  keys: (string | null)[];
  isMarked: boolean;
}

/** A record of a kind as it is kept now: its status, its places and its mark. */
async function recordOf(
  db: Database,
  kind: ProofKind,
  id: string,
): Promise<StoredRecord | undefined> {
  const source = PROOF_SOURCES[kind];
  const [row] = await db
    .select({
      status: source.status,
      keys: sql<
        (string | null)[]
      >`json_build_array(${sql.join([...source.keys], sql`, `)})`,
      isMarked: sql<boolean>`${source.removedAt} is not null`,
    })
    .from(source.table)
    .where(eq(source.id, id));
  return row;
}

/** Every place a record of a kind used for its file. */
function placesOf(kind: ProofKind, key: string): string[] {
  return kind === "siku_photo" ? [key, `${key}-kecil`] : [key];
}

/** The places of a record of a kind once its file is gone. */
function noPlaces(kind: ProofKind): null[] {
  return kind === "siku_photo" ? [null, null] : [null];
}

/** A storage that refuses to remove after some files went. */
function storeFailingAfter(store: MemoryStore, removals: number): FileStore {
  let left = removals;
  return {
    ...store,
    async remove(key) {
      if (left === 0) throw new Error("The storage stopped.");
      left -= 1;
      await store.remove(key);
    },
  };
}

describe("removeOldProofs", () => {
  it("removes the decided files of an old period and keeps their records", async () => {
    await inTestDatabase(async (db) => {
      const { actor, old, store } = await addSettingWithDays(db, "9989510001");

      const removed = await removeOldProofs(db, store, actor, NOW);

      expect(removed).toEqual({ ok: true, value: 6 });
      for (const kind of PROOF_KINDS) {
        for (const place of placesOf(kind, old[kind].key)) {
          expect(store.files.has(place)).toBe(false);
        }
        const record = await recordOf(db, kind, old[kind].id);
        expect(record?.isMarked).toBe(true);
        expect(record?.keys).toEqual(noPlaces(kind));
      }
      expect(
        (await recordOf(db, "attendance_photo", old.attendance_photo.id))
          ?.status,
      ).toBe("valid");
      expect(
        (await recordOf(db, "appeal_proof", old.appeal_proof.id))?.status,
      ).toBe("rejected");
    });
  });

  it("never removes a file whose record still waits", async () => {
    await inTestDatabase(async (db) => {
      const { actor, waiting, store } = await addSettingWithDays(
        db,
        "9989510002",
      );

      await removeOldProofs(db, store, actor, NOW);

      for (const kind of PROOF_KINDS) {
        for (const place of placesOf(kind, waiting[kind].key)) {
          expect(store.files.has(place)).toBe(true);
        }
        const record = await recordOf(db, kind, waiting[kind].id);
        expect(record?.isMarked).toBe(false);
        expect(record?.keys[0]).toBe(waiting[kind].key);
      }
    });
  });

  it("removes the waiting files of a removed schedule, and keeps their records and the schedule removed", async () => {
    await inTestDatabase(async (db) => {
      const { actor, proofSetting, waiting, store } = await addSettingWithDays(
        db,
        "9989510012",
      );
      const ofRemoved = await addTestProofs(
        db,
        proofSetting,
        SENT_AT,
        false,
        store,
      );
      const scheduleIds = await removeSchedulesOf(db, proofSetting, ofRemoved);

      const removed = await removeOldProofs(db, store, actor, NOW);

      expect(removed).toEqual({ ok: true, value: 8 });
      const goneKinds = ["attendance_photo", "activity_clarification"] as const;
      for (const kind of goneKinds) {
        expect(store.files.has(ofRemoved[kind].key)).toBe(false);
        const record = await recordOf(db, kind, ofRemoved[kind].id);
        expect(record?.isMarked).toBe(true);
        expect(record?.keys).toEqual([null]);
        expect(store.files.has(waiting[kind].key)).toBe(true);
      }
      expect(
        (await recordOf(db, "attendance_photo", ofRemoved.attendance_photo.id))
          ?.status,
      ).toBe("waiting");
      expect(
        (
          await recordOf(
            db,
            "activity_clarification",
            ofRemoved.activity_clarification.id,
          )
        )?.status,
      ).toBe("submitted");
      const schedules = await db
        .select({ deletedAt: activitySchedules.deletedAt })
        .from(activitySchedules)
        .where(inArray(activitySchedules.id, scheduleIds));
      expect(schedules).toHaveLength(2);
      for (const schedule of schedules) {
        expect(schedule.deletedAt).not.toBeNull();
      }
      expect(store.files.has(ofRemoved.dorm_clarification.key)).toBe(true);
    });
  });

  it("keeps the files of a period that did not end long enough ago", async () => {
    await inTestDatabase(async (db) => {
      const { actor, old, store } = await addSettingWithDays(db, "9989510003");

      const removed = await removeOldProofs(
        db,
        store,
        actor,
        new Date("3402-02-15T03:00:00Z"),
      );

      expect(removed).toEqual({ ok: true, value: 0 });
      expect(store.files.has(old.return_photo.key)).toBe(true);
    });
  });

  it("removes nothing the second time", async () => {
    await inTestDatabase(async (db) => {
      const { actor, store } = await addSettingWithDays(db, "9989510004");
      await removeOldProofs(db, store, actor, NOW);

      const again = await removeOldProofs(db, store, actor, NOW);

      expect(again).toEqual({ ok: true, value: 0 });
    });
  });

  it("removes nothing while the number of days is not set", async () => {
    await inTestDatabase(async (db) => {
      const { actor, old, store } = await addSetting(db, "9989510005");

      const removed = await removeOldProofs(db, store, actor, NOW);

      expect(removed).toEqual(NOT_SET_REFUSAL);
      expect(store.files.has(old.siku_photo.key)).toBe(true);
      const record = await recordOf(db, "siku_photo", old.siku_photo.id);
      expect(record?.isMarked).toBe(false);
    });
  });

  it("removes nothing where there is no file storage", async () => {
    await inTestDatabase(async (db) => {
      const { actor, old } = await addSettingWithDays(db, "9989510006");

      const removed = await removeOldProofs(db, null, actor, NOW);

      expect(removed).toEqual(NO_STORAGE_REFUSAL);
      const record = await recordOf(db, "siku_photo", old.siku_photo.id);
      expect(record?.isMarked).toBe(false);
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "head_of_unit"))(
    "refuses %s and removes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { old, store } = await addSettingWithDays(db, "9989510007");
        const other = await addTestActor(db, "Pegawai Uji Hapus", [role]);

        const removed = await removeOldProofs(db, store, other, NOW);

        expect(removed).toEqual(NOT_ALLOWED);
        for (const kind of PROOF_KINDS) {
          expect(store.files.has(old[kind].key)).toBe(true);
          expect((await recordOf(db, kind, old[kind].id))?.isMarked).toBe(
            false,
          );
        }
      });
    },
  );

  it("leaves every file it did not remove marked or kept, and the next press finishes", async () => {
    await inTestDatabase(async (db) => {
      const { actor, old, store } = await addSettingWithDays(db, "9989510008");

      const stopped = await removeOldProofs(
        db,
        storeFailingAfter(store, 2),
        actor,
        NOW,
      );

      // The attendance photo went whole; the SIKU photo lost its large copy only.
      expect(stopped).toEqual(STOPPED_REFUSAL);
      expect(store.files.has(old.siku_photo.key)).toBe(false);
      expect(store.files.has(`${old.siku_photo.key}-kecil`)).toBe(true);
      expect(store.files.has(old.dorm_clarification.key)).toBe(true);
      for (const kind of PROOF_KINDS) {
        const record = await recordOf(db, kind, old[kind].id);
        expect(record?.isMarked).toBe(true);
      }

      const finished = await removeOldProofs(db, store, actor, NOW);

      expect(finished).toEqual({ ok: true, value: 5 });
      for (const kind of PROOF_KINDS) {
        const record = await recordOf(db, kind, old[kind].id);
        expect(record?.keys).toEqual(noPlaces(kind));
        for (const place of placesOf(kind, old[kind].key)) {
          expect(store.files.has(place)).toBe(false);
        }
      }
      expect(await db.select().from(proofFileRemovals)).toHaveLength(1);
    });
  });
});

describe("the log of removed proof files", () => {
  it("gets one line: who, when, the days set and how many of each kind, naming no student", async () => {
    await inTestDatabase(async (db) => {
      const { actor, store } = await addSettingWithDays(db, "9989510009");

      await removeOldProofs(db, store, actor, NOW);

      const lines = await db.select().from(proofFileRemovals);
      expect(lines).toEqual([
        {
          id: expect.any(String),
          removedBy: actor.id,
          removedAt: NOW,
          keepDays: 30,
          attendancePhotos: 1,
          sikuPhotos: 1,
          returnPhotos: 1,
          activityClarificationFiles: 1,
          dormClarificationFiles: 1,
          appealProofs: 1,
        },
      ]);
      expect(JSON.stringify(lines)).not.toContain("Mahasiswa Uji Berkas");
    });
  });

  it("gets no line when nothing went", async () => {
    await inTestDatabase(async (db) => {
      const { actor, store } = await addSettingWithDays(db, "9989510010");
      await removeOldProofs(db, store, actor, NOW);

      await removeOldProofs(db, store, actor, NOW);

      expect(await db.select().from(proofFileRemovals)).toHaveLength(1);
    });
  });

  it("gets no line when the removal is refused", async () => {
    await inTestDatabase(async (db) => {
      const { store } = await addSettingWithDays(db, "9989510011");
      const other = await addTestActor(db, "Pengasuh Uji Hapus", ["mentor"]);

      await removeOldProofs(db, store, other, NOW);

      expect(await db.select().from(proofFileRemovals)).toEqual([]);
    });
  });
});
