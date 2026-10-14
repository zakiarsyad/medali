// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_SIKU_REQUESTS } from "./sample-siku-requests";
import { sikuAdjustments, sikuRequestPhotos, sikuRequests } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample requests for a SIKU gain", { timeout: 20_000 }, () => {
  it("are all added with their photo places, sent before now, an approved one with its gain", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const kept = await db.select().from(sikuRequests);
      const photos = await db.select().from(sikuRequestPhotos);
      const gains = await db
        .select({
          requestStudent: sikuRequests.studentId,
          reason: sikuAdjustments.reason,
          requestReason: sikuRequests.reason,
          day: sikuAdjustments.day,
          requestDay: sikuRequests.day,
          cancelledAt: sikuAdjustments.cancelledAt,
        })
        .from(sikuRequests)
        .innerJoin(
          sikuAdjustments,
          eq(sikuAdjustments.id, sikuRequests.entryId),
        );

      expect(kept).toHaveLength(SAMPLE_SIKU_REQUESTS.length);
      const placesWanted = SAMPLE_SIKU_REQUESTS.reduce(
        (sum, request) => sum + request.photos,
        0,
      );
      expect(photos).toHaveLength(placesWanted);
      for (const photo of photos) expect(photo.photoKey).toBeNull();
      for (const request of kept) {
        expect(request.sentAt.getTime()).toBeLessThanOrEqual(now.getTime());
        if (request.decidedAt === null) continue;
        expect(request.decidedAt.getTime()).toBeGreaterThanOrEqual(
          request.sentAt.getTime(),
        );
      }
      expect(gains).toHaveLength(2);
      for (const gain of gains) {
        expect(gain.reason).toBe(gain.requestReason);
        expect(gain.day).toBe(gain.requestDay);
      }
      expect(gains.filter((gain) => gain.cancelledAt !== null)).toHaveLength(1);
    });
  });
});
