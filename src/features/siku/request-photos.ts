import { asc, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sikuRequestPhotos } from "@/db/schema";
import { removedFileWords } from "@/ui/removed-file";

/** A proof photo of a request as the screens show it. */
export interface RequestPhoto {
  id: string;
  /** Whether a picture is kept for it: a sample photo may have none yet. */
  isKept: boolean;
  /** What it says once removed as old proof, or null while it is not. */
  removed: string | null;
}

/** The photos of some requests, each request's in the order picked. */
export async function readRequestPhotos(
  db: Database,
  requestIds: readonly string[],
): Promise<Map<string, RequestPhoto[]>> {
  const byRequest = new Map<string, RequestPhoto[]>();
  if (requestIds.length === 0) return byRequest;
  const rows = await db
    .select({
      id: sikuRequestPhotos.id,
      requestId: sikuRequestPhotos.requestId,
      isKept: sql<boolean>`${sikuRequestPhotos.photoKey} is not null and ${sikuRequestPhotos.fileRemovedAt} is null`,
      removedAt: sikuRequestPhotos.fileRemovedAt,
    })
    .from(sikuRequestPhotos)
    .where(inArray(sikuRequestPhotos.requestId, [...requestIds]))
    .orderBy(asc(sikuRequestPhotos.requestId), asc(sikuRequestPhotos.place));
  for (const { requestId, removedAt, ...photo } of rows) {
    const photos = byRequest.get(requestId) ?? [];
    photos.push({ ...photo, removed: removedFileWords(removedAt) });
    byRequest.set(requestId, photos);
  }
  return byRequest;
}
