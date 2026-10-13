import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { JPEG } from "@/files/file-kinds";
import { memoryStore } from "@/files/memory-store";
import type { Database } from "./connect";
import { samplePhotoBytes } from "./sample-attendance-photo";
import { activityAttendances } from "./schema";
import { addSamplePhotos, samplePhotosAdded } from "./seed-attendance-photos";
import { withTestDatabase } from "./test-database";

/*
 * This file's own sample values: the Tahun akademik 2200, the program
 * UJIFOTOCONTOH and the NIMs 9972600000 to 9972600099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  waitingId: string;
  rejectedId: string;
  dispensationId: string;
  sentId: string;
}

/** A waiting, a rejected and a sent attendance, and a dispensation. */
async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Foto Contoh", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2200);
  const programId = await addTestProgram(db, "UJIFOTOCONTOH");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9972600001",
    name: "Mahasiswa Uji Foto Contoh",
    cohortYear: 2199,
  });
  const days = ["2200-09-10", "2200-09-11", "2200-09-12", "2200-09-13"];
  const [first, second, third, fourth] = await Promise.all(
    days.map((startsOn) =>
      addTestSchedule(db, {
        activityId,
        academicPeriodId: periods.oddId,
        changedBy: staff.id,
        startsOn,
      }),
    ),
  );
  if (!first || !second || !third || !fourth) {
    throw new Error("The schedules were not added.");
  }
  const { studentId } = student;
  function add(scheduleId: string, more: { status: "waiting" | "rejected" }) {
    return addTestAttendance(db, staff.id, { scheduleId, studentId, ...more });
  }
  return {
    waitingId: await add(first, { status: "waiting" }),
    rejectedId: await add(second, { status: "rejected" }),
    dispensationId: await addTestAttendance(db, staff.id, {
      scheduleId: third,
      studentId,
      status: "dispensation",
      sentAt: null,
    }),
    sentId: await addTestAttendance(db, staff.id, {
      scheduleId: fourth,
      studentId,
      status: "waiting",
      photoKey: "attendance-photos/sudah-ada",
    }),
  };
}

async function photoKeyOf(db: Database, id: string): Promise<string | null> {
  const [attendance] = await db
    .select({ photoKey: activityAttendances.photoKey })
    .from(activityAttendances)
    .where(eq(activityAttendances.id, id));
  return attendance?.photoKey ?? null;
}

describe("the drawn sample picture", () => {
  it("is a JPEG that the rule for attendance photos takes", () => {
    const bytes = samplePhotoBytes();

    expect(JPEG.holds(bytes)).toBe(true);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.length).toBeLessThan(20_000);
  });
});

describe("addSamplePhotos", () => {
  it("gives the picture to each attendance that has a time sent and no photo, each a copy of its own", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      const added = await addSamplePhotos(db, store);

      const waitingKey = await photoKeyOf(db, records.waitingId);
      const rejectedKey = await photoKeyOf(db, records.rejectedId);
      expect(added).toBe(2);
      expect(waitingKey).toMatch(/^attendance-photos\//);
      expect(rejectedKey).toMatch(/^attendance-photos\//);
      expect(waitingKey).not.toBe(rejectedKey);
      expect(store.files.get(waitingKey ?? "")).toEqual({
        bytes: samplePhotoBytes(),
        contentType: "image/jpeg",
      });
      expect(store.files.size).toBe(2);
    });
  });

  it("leaves a dispensation without a photo, and a photo that was sent as it is", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addSamplePhotos(db, memoryStore());

      expect(await photoKeyOf(db, records.dispensationId)).toBeNull();
      expect(await photoKeyOf(db, records.sentId)).toBe(
        "attendance-photos/sudah-ada",
      );
    });
  });

  it("adds nothing the second time", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const store = memoryStore();
      await addSamplePhotos(db, store);

      expect(await addSamplePhotos(db, store)).toBe(0);
      expect(store.files.size).toBe(2);
    });
  });
});

describe("samplePhotosAdded", () => {
  it("keeps nothing and says so where the file storage settings are empty", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const said = await samplePhotosAdded(db, null);

      expect(said).toBe(
        "The file storage settings are empty; no sample photo is kept.",
      );
      expect(await photoKeyOf(db, records.waitingId)).toBeNull();
    });
  });

  it("says how many photos were added", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await samplePhotosAdded(db, memoryStore())).toBe(
        "Sample attendance photos added: 2.",
      );
    });
  });
});
