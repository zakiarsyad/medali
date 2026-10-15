// Sample Tahun akademik of this file: those of the app's sample data.
import { isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_SKPM_UPLOADS } from "./sample-skpm";
import {
  skpmConversions,
  skpmRows,
  skpmUploadChanges,
  skpmUploads,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample SKPM data", { timeout: 20_000 }, () => {
  it("is all added: uploads with their rows, counts and log lines, one removed, all before now, and no conversion set", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const uploads = await db.select().from(skpmUploads);
      const rows = await db.select().from(skpmRows);
      const lines = await db.select().from(skpmUploadChanges);
      const removed = await db
        .select()
        .from(skpmUploads)
        .where(isNotNull(skpmUploads.removedAt));
      const conversions = await db.select().from(skpmConversions);

      expect(uploads).toHaveLength(SAMPLE_SKPM_UPLOADS.length);
      const sampleRows = SAMPLE_SKPM_UPLOADS.flatMap((upload) => upload.rows);
      expect(rows).toHaveLength(sampleRows.length);
      expect(removed).toHaveLength(1);
      expect(lines).toHaveLength(uploads.length + removed.length);
      for (const upload of uploads) {
        expect(upload.enteredAt.getTime()).toBeLessThanOrEqual(now.getTime());
        const own = rows.filter((row) => row.uploadId === upload.id);
        const students = new Set(own.map((row) => row.studentId));
        expect(upload.rowCount).toBe(own.length);
        expect(upload.studentCount).toBe(students.size);
      }
      expect(conversions).toEqual([]);
    });
  });
});
