// Sample Tahun akademik of this file: 2910 to 2910.
// Sample NIMs of this file: 9937900000 to 9937900099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addTestResidents } from "@/features/dorm/test-leave";
import { addTestActor } from "@/features/dorm/test-records";
import { addApprovedLeave, addTestReport } from "@/features/dorm/test-returns";
import { memoryStore } from "@/files/memory-store";
import type { Database } from "./connect";
import { samplePhotoBytes } from "./sample-attendance-photo";
import { dormReturnReports } from "./schema";
import {
  addSampleReturnPhotos,
  sampleReturnPhotosAdded,
} from "./seed-return-photos";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** Two reports without a photo, and one whose photo was sent. */
async function addRecords(db: Database) {
  const [ani] = await addTestResidents(db, 2910, "Prodi Uji Foto Kembali", [
    "9937900001",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  const manager = await addTestActor(db, "Pengelola Uji Foto Kembali", [
    "dorm_manager",
  ]);
  const leaveId = await addApprovedLeave(db, ani.studentId, manager.id, {
    startsAt: "2910-10-13T09:00",
    endsAt: "2910-10-13T16:00",
  });
  const rejected = {
    status: "rejected",
    verifiedBy: manager.id,
    verifiedAt: new Date(),
    verifyNote: "Foto tidak menunjukkan asrama.",
  } as const;
  return {
    rejectedId: await addTestReport(db, leaveId, "2910-10-13T15:40", {
      ...rejected,
      photoKey: null,
    }),
    waitingId: await addTestReport(db, leaveId, "2910-10-13T15:50", {
      photoKey: null,
    }),
    sentId: await addTestReport(db, leaveId, "2910-10-13T15:45", {
      ...rejected,
      photoKey: "return-photos/sudah-ada",
    }),
  };
}

async function photoKeyOf(db: Database, id: string): Promise<string | null> {
  const [report] = await db
    .select({ photoKey: dormReturnReports.photoKey })
    .from(dormReturnReports)
    .where(eq(dormReturnReports.id, id));
  return report?.photoKey ?? null;
}

describe("addSampleReturnPhotos", () => {
  it("gives the drawn picture to each report without a photo, each a copy of its own, and leaves a sent photo as it is", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      const added = await addSampleReturnPhotos(db, store);

      const waitingKey = await photoKeyOf(db, records.waitingId);
      const rejectedKey = await photoKeyOf(db, records.rejectedId);
      expect(added).toBe(2);
      expect(waitingKey).toMatch(/^return-photos\//);
      expect(rejectedKey).toMatch(/^return-photos\//);
      expect(waitingKey).not.toBe(rejectedKey);
      expect(store.files.get(waitingKey ?? "")).toEqual({
        bytes: samplePhotoBytes(),
        contentType: "image/jpeg",
      });
      expect(await photoKeyOf(db, records.sentId)).toBe(
        "return-photos/sudah-ada",
      );
    });
  });

  it("adds nothing the second time", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const store = memoryStore();
      await addSampleReturnPhotos(db, store);

      expect(await addSampleReturnPhotos(db, store)).toBe(0);
      expect(store.files.size).toBe(2);
    });
  });
});

describe("sampleReturnPhotosAdded", () => {
  it("keeps nothing and says so where the file storage settings are empty", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const said = await sampleReturnPhotosAdded(db, null);

      expect(said).toBe(
        "The file storage settings are empty; no sample return photo is kept.",
      );
      expect(await photoKeyOf(db, records.waitingId)).toBeNull();
    });
  });

  it("says how many photos were added", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await sampleReturnPhotosAdded(db, memoryStore())).toBe(
        "Sample return photos added: 2.",
      );
    });
  });
});
