// Sample Tahun akademik of this file: those of the app's sample data.
import { eq, isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { SAMPLE_SIKU_ENTRIES } from "./sample-siku-adjustments";
import { SAMPLE_SIKU_REQUESTS } from "./sample-siku-requests";
import {
  academicPeriods,
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
  sikuRequestPhotos,
  sikuRequests,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function expectSampleEntries(db: Database, now: Date) {
  const kept = await db.select().from(sikuAdjustments);
  const named = await db.select().from(sikuAdjustmentStudents);
  const lines = await db.select().from(sikuAdjustmentChanges);
  const cancelled = await db
    .select()
    .from(sikuAdjustments)
    .where(isNotNull(sikuAdjustments.cancelledAt));
  const periods = await db.select().from(academicPeriods);

  expect(kept).toHaveLength(SAMPLE_SIKU_ENTRIES.length);
  const nims = SAMPLE_SIKU_ENTRIES.flatMap((entry) => entry.nims);
  expect(named).toHaveLength(nims.length);
  expect(lines).toHaveLength(kept.length + cancelled.length);
  expect(cancelled).toHaveLength(1);
  for (const entry of kept) {
    expect(entry.enteredAt.getTime()).toBeLessThanOrEqual(now.getTime());
  }
  const usedPeriods = new Set(kept.map((entry) => entry.periodId));
  expect(usedPeriods.size).toBeGreaterThan(1);
  expect(periods.length).toBeGreaterThan(1);
}

async function expectSampleRequests(db: Database, now: Date) {
  const kept = await db.select().from(sikuRequests);
  const photos = await db.select().from(sikuRequestPhotos);
  const gains = await db
    .select({
      reason: sikuAdjustments.reason,
      requestReason: sikuRequests.reason,
      day: sikuAdjustments.day,
      requestDay: sikuRequests.day,
      cancelledAt: sikuAdjustments.cancelledAt,
    })
    .from(sikuRequests)
    .innerJoin(sikuAdjustments, eq(sikuAdjustments.id, sikuRequests.entryId));

  expect(kept).toHaveLength(SAMPLE_SIKU_REQUESTS.length);
  const places = SAMPLE_SIKU_REQUESTS.reduce(
    (sum, request) => sum + request.photos,
    0,
  );
  expect(photos).toHaveLength(places);
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
}

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables, so
// the entries and the requests are checked on one load.
describe("the sample SIKU entries and requests", { timeout: 20_000 }, () => {
  it("are all added: entries with their students and log lines in more than one period, requests with their photo places, an approved one with its gain, all before now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      await expectSampleEntries(db, now);
      await expectSampleRequests(db, now);
    });
  });
});
