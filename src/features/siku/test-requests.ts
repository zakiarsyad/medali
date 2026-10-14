import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sikuRequestPhotos, sikuRequests } from "@/db/schema";

/** Made-up requests for a SIKU gain, for the checks of this area. */

type StoredRequest = typeof sikuRequests.$inferInsert;

export interface TestRequest {
  day?: string;
  sentAt?: Date;
  /** Where each photo is kept, one per photo; null for one not kept yet. */
  photoKeys?: (string | null)[];
  more?: Partial<StoredRequest>;
}

/**
 * A request kept as it is, without the rules that check a sent one: it
 * waits, unless `more` says otherwise. Gives its key.
 */
export async function addTestRequest(
  db: Database,
  studentId: string,
  request: TestRequest = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const day = request.day ?? "2912-10-10";
  await db.insert(sikuRequests).values({
    id,
    studentId,
    reason: "knowledge_sharing",
    day,
    report: "Berbagi pengetahuan literasi keuangan untuk mahasiswa baru.",
    sentAt: request.sentAt ?? new Date(`${day}T19:00:00+07:00`),
    ...request.more,
  });
  const keys = request.photoKeys ?? [null];
  await db.insert(sikuRequestPhotos).values(
    keys.map((key, at) => ({
      requestId: id,
      place: at + 1,
      photoKey: key,
      thumbKey: key === null ? null : `${key}-kecil`,
    })),
  );
  return id;
}

/** The photos of a request, in their order. */
export function photosOf(db: Database, requestId: string) {
  return db
    .select()
    .from(sikuRequestPhotos)
    .where(eq(sikuRequestPhotos.requestId, requestId))
    .orderBy(sikuRequestPhotos.place);
}
