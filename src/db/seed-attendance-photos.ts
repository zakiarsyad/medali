import { and, eq, isNotNull, isNull } from "drizzle-orm";
import {
  PHOTO_FILE_NAME,
  PHOTO_FOLDER,
  PHOTO_RULE,
} from "@/features/activities/attendance-photo";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Database } from "./connect";
import { samplePhotoBytes } from "./sample-attendance-photo";
import { activityAttendances } from "./schema";

/** How many pictures are on their way to the file storage at a time. */
const AT_A_TIME = 8;

async function addSamplePhoto(
  db: Database,
  store: FileStore,
  attendanceId: string,
  photo: { name: string; bytes: Uint8Array },
): Promise<void> {
  const kept = await keepFile(store, PHOTO_FOLDER, photo, PHOTO_RULE);
  if (!kept.ok) {
    throw new Error(`The sample photo was refused: ${kept.fault}.`);
  }
  await db
    .update(activityAttendances)
    .set({ photoKey: kept.key })
    .where(eq(activityAttendances.id, attendanceId));
}

/**
 * Gives the drawn sample picture to every attendance that has a time
 * sent and no photo, and says how many got one. That is the sample
 * attendance alone: a photo a person sends is kept before its attendance
 * is saved. Each gets a copy of its own, as each sent photo has. Run a
 * second time it finds none left. It is for sample data only, so it is
 * never run on the campus server.
 */
export async function addSamplePhotos(
  db: Database,
  store: FileStore,
): Promise<number> {
  const without = await db
    .select({ id: activityAttendances.id })
    .from(activityAttendances)
    .where(
      and(
        isNotNull(activityAttendances.sentAt),
        isNull(activityAttendances.photoKey),
      ),
    );
  const photo = { name: PHOTO_FILE_NAME, bytes: samplePhotoBytes() };
  for (let first = 0; first < without.length; first += AT_A_TIME) {
    const together = without.slice(first, first + AT_A_TIME);
    await Promise.all(
      together.map(({ id }) => addSamplePhoto(db, store, id, photo)),
    );
  }
  return without.length;
}

/**
 * Adds the sample photos where there is a file storage, and says in one
 * line what was done. `store` is null while its settings are empty:
 * nothing is kept then, and the sample attendance stays without photos.
 */
export async function samplePhotosAdded(
  db: Database,
  store: FileStore | null,
): Promise<string> {
  if (!store) {
    return "The file storage settings are empty; no sample photo is kept.";
  }
  const added = await addSamplePhotos(db, store);
  return `Sample attendance photos added: ${added}.`;
}
