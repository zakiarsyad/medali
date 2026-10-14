import { eq, isNull } from "drizzle-orm";
import {
  RETURN_PHOTO_FILE_NAME,
  RETURN_PHOTO_FOLDER,
  RETURN_PHOTO_RULE,
} from "@/features/dorm/return-photo";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Database } from "./connect";
import { samplePhotoBytes } from "./sample-attendance-photo";
import { dormReturnReports } from "./schema";

/** How many pictures are on their way to the file storage at a time. */
const AT_A_TIME = 8;

async function addSampleReturnPhoto(
  db: Database,
  store: FileStore,
  reportId: string,
  photo: { name: string; bytes: Uint8Array },
): Promise<void> {
  const kept = await keepFile(
    store,
    RETURN_PHOTO_FOLDER,
    photo,
    RETURN_PHOTO_RULE,
  );
  if (!kept.ok) {
    throw new Error(`The sample return photo was refused: ${kept.fault}.`);
  }
  await db
    .update(dormReturnReports)
    .set({ photoKey: kept.key })
    .where(eq(dormReturnReports.id, reportId));
}

/**
 * Gives the drawn sample picture, which has no person in it, to every
 * report of a return without a photo, and says how many got one. That is
 * the sample reports alone: the photo a resident sends is kept before
 * their report is saved. Each gets a copy of its own. Run a second time
 * it finds none left. It is for sample data only, so it is never run on
 * the campus server.
 */
export async function addSampleReturnPhotos(
  db: Database,
  store: FileStore,
): Promise<number> {
  const without = await db
    .select({ id: dormReturnReports.id })
    .from(dormReturnReports)
    .where(isNull(dormReturnReports.photoKey));
  const photo = { name: RETURN_PHOTO_FILE_NAME, bytes: samplePhotoBytes() };
  for (let first = 0; first < without.length; first += AT_A_TIME) {
    const together = without.slice(first, first + AT_A_TIME);
    await Promise.all(
      together.map(({ id }) => addSampleReturnPhoto(db, store, id, photo)),
    );
  }
  return without.length;
}

/**
 * Adds the sample return photos where there is a file storage, and says
 * in one line what was done. `store` is null while its settings are
 * empty: nothing is kept then, and the sample reports stay without
 * photos.
 */
export async function sampleReturnPhotosAdded(
  db: Database,
  store: FileStore | null,
): Promise<string> {
  if (!store) {
    return "The file storage settings are empty; no sample return photo is kept.";
  }
  const added = await addSampleReturnPhotos(db, store);
  return `Sample return photos added: ${added}.`;
}
