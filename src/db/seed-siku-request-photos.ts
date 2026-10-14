import { eq, isNull } from "drizzle-orm";
import {
  REQUEST_PHOTO_FILE_NAME,
  REQUEST_PHOTO_FOLDER,
  REQUEST_PHOTO_RULE,
  REQUEST_THUMB_RULE,
} from "@/features/siku/request-photo";
import type { FileRule } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Database } from "./connect";
import { samplePhotoBytes } from "./sample-attendance-photo";
import { sikuRequestPhotos } from "./schema";

/** How many pictures are on their way to the file storage at a time. */
const AT_A_TIME = 8;

async function keepSample(
  store: FileStore,
  rule: FileRule,
  photo: { name: string; bytes: Uint8Array },
): Promise<string> {
  const kept = await keepFile(store, REQUEST_PHOTO_FOLDER, photo, rule);
  if (!kept.ok) {
    throw new Error(`The sample request photo was refused: ${kept.fault}.`);
  }
  return kept.key;
}

async function addSamplePhoto(
  db: Database,
  store: FileStore,
  id: string,
  photo: { name: string; bytes: Uint8Array },
): Promise<void> {
  const photoKey = await keepSample(store, REQUEST_PHOTO_RULE, photo);
  const thumbKey = await keepSample(store, REQUEST_THUMB_RULE, photo);
  await db
    .update(sikuRequestPhotos)
    .set({ photoKey, thumbKey })
    .where(eq(sikuRequestPhotos.id, id));
}

/**
 * Gives the drawn sample picture, which has no person in it, to every
 * photo of a request for a SIKU gain that has none, as the photo and as
 * its small copy, and says how many got one. That is the sample requests
 * alone: the photos a student sends are kept before their request is
 * saved. The drawn picture is small already, so it is its own small
 * copy. Run a second time it finds none left. It is for sample data
 * only, so it is never run on the campus server.
 */
export async function addSampleRequestPhotos(
  db: Database,
  store: FileStore,
): Promise<number> {
  const without = await db
    .select({ id: sikuRequestPhotos.id })
    .from(sikuRequestPhotos)
    .where(isNull(sikuRequestPhotos.photoKey));
  const photo = { name: REQUEST_PHOTO_FILE_NAME, bytes: samplePhotoBytes() };
  for (let first = 0; first < without.length; first += AT_A_TIME) {
    const together = without.slice(first, first + AT_A_TIME);
    await Promise.all(
      together.map(({ id }) => addSamplePhoto(db, store, id, photo)),
    );
  }
  return without.length;
}

/**
 * Adds the sample request photos where there is a file storage, and says
 * in one line what was done. `store` is null while its settings are
 * empty: nothing is kept then, and the sample requests stay without
 * pictures.
 */
export async function sampleRequestPhotosAdded(
  db: Database,
  store: FileStore | null,
): Promise<string> {
  if (!store) {
    return "The file storage settings are empty; no sample SIKU request photo is kept.";
  }
  const added = await addSampleRequestPhotos(db, store);
  return `Sample SIKU request photos added: ${added}.`;
}
