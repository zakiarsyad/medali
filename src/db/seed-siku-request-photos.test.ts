// Sample Tahun akademik of this file: 2912 to 2912.
// Sample NIMs of this file: 9964001200 to 9964001299.
import { describe, expect, it } from "vitest";
import { addTestRequest, photosOf } from "@/features/siku/test-requests";
import { addTestStudents } from "@/features/siku/test-siku";
import { memoryStore } from "@/files/memory-store";
import type { Database } from "./connect";
import { samplePhotoBytes } from "./sample-attendance-photo";
import {
  addSampleRequestPhotos,
  sampleRequestPhotosAdded,
} from "./seed-siku-request-photos";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** A request with two photos not kept yet, and one whose photo was sent. */
async function addRecords(db: Database) {
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Foto Pengajuan",
    2912,
    ["9964001201"],
  );
  const [studentId = ""] = studentIds;
  return {
    sampleId: await addTestRequest(db, studentId, {
      photoKeys: [null, null],
    }),
    sentId: await addTestRequest(db, studentId, {
      photoKeys: ["siku-request-photos/sudah-ada"],
    }),
  };
}

describe("addSampleRequestPhotos", () => {
  it("gives the drawn picture, large and small, to each photo not kept, each a copy of its own, and leaves a sent photo as it is", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      const added = await addSampleRequestPhotos(db, store);

      const [first, second] = await photosOf(db, records.sampleId);
      expect(added).toBe(2);
      expect(first?.photoKey).toMatch(/^siku-request-photos\//);
      expect(first?.thumbKey).toMatch(/^siku-request-photos\//);
      expect(second?.photoKey).toMatch(/^siku-request-photos\//);
      const keys = new Set([
        first?.photoKey,
        first?.thumbKey,
        second?.photoKey,
        second?.thumbKey,
      ]);
      expect(keys.size).toBe(4);
      expect(store.files.get(first?.photoKey ?? "")).toEqual({
        bytes: samplePhotoBytes(),
        contentType: "image/jpeg",
      });
      const [sent] = await photosOf(db, records.sentId);
      expect(sent?.photoKey).toBe("siku-request-photos/sudah-ada");
    });
  });

  it("adds nothing the second time", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const store = memoryStore();
      await addSampleRequestPhotos(db, store);

      expect(await addSampleRequestPhotos(db, store)).toBe(0);
      expect(store.files.size).toBe(4);
    });
  });
});

describe("sampleRequestPhotosAdded", () => {
  it("keeps nothing and says so where the file storage settings are empty", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const said = await sampleRequestPhotosAdded(db, null);

      expect(said).toBe(
        "The file storage settings are empty; no sample SIKU request photo is kept.",
      );
      const [first] = await photosOf(db, records.sampleId);
      expect(first?.photoKey).toBeNull();
    });
  });

  it("says how many photos were added", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await sampleRequestPhotosAdded(db, memoryStore())).toBe(
        "Sample SIKU request photos added: 2.",
      );
    });
  });
});
