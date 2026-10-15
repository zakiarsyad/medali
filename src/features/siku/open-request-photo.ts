import { and, eq, isNull, type SQL } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { sikuRequestPhotos, sikuRequests, students } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import { JPEG } from "@/files/file-kinds";
import type { FileStore } from "@/files/file-store";
import { NOT_WITHDRAWN } from "./own-requests";
import { REQUEST_PHOTO_FILE_NAME } from "./request-photo";

export type OpenedRequestPhoto =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedRequestPhoto {
  return { ok: false, refusal };
}

/** Whose request photos an account may open. */
function whichOf(account: AccountForAccess, visible: SQL | null): SQL | null {
  if (visible !== null) return visible;
  if (!may(account.roles, "ask_siku_addition")) return null;
  if (account.studentId === null) return null;
  return eq(students.id, account.studentId);
}

/**
 * Where a photo, or its small copy, is kept, when its request was not
 * withdrawn and its student is among `which`.
 */
async function keyWithin(
  db: Database,
  which: SQL,
  photoId: string,
  isSmall: boolean,
): Promise<string | null> {
  const [photo] = await db
    .select({
      photoKey: sikuRequestPhotos.photoKey,
      thumbKey: sikuRequestPhotos.thumbKey,
    })
    .from(sikuRequestPhotos)
    .innerJoin(sikuRequests, eq(sikuRequests.id, sikuRequestPhotos.requestId))
    .innerJoin(students, eq(students.id, sikuRequests.studentId))
    .where(
      and(
        eq(sikuRequestPhotos.id, photoId),
        isNull(sikuRequestPhotos.fileRemovedAt),
        NOT_WITHDRAWN,
        which,
      ),
    );
  if (!photo) return null;
  return isSmall ? photo.thumbKey : photo.photoKey;
}

/**
 * A storage that fails or cannot be reached is not an error to pass on:
 * the person is told to try again, and the cause is logged, which names
 * no person and no key.
 */
async function keptBytes(
  store: FileStore,
  key: string,
): Promise<Uint8Array | "unreachable" | null> {
  try {
    return await store.get(key);
  } catch (error) {
    console.error("A kept SIKU request photo was not opened.", error);
    return "unreachable";
  }
}

/**
 * A proof photo of a request for a SIKU gain, large or as its small
 * copy, for the accounts that may open it: the student who sent it, and
 * staff among whose students `visible` holds that student, which the
 * caller reads from the right to read SIKU: Ketua Program Studi those of
 * their own program, Pengasuh their own mentees. `visible` is null for an
 * account without that right. A photo of a withdrawn request, or out of
 * reach, answers as one that does not exist, so nobody learns which
 * requests there are. `account` is null for a visitor who is not signed
 * in, and `photoId` comes from the address and is not trusted.
 */
export async function openRequestPhoto(
  db: Database,
  store: FileStore | null,
  account: AccountForAccess | null,
  visible: SQL | null,
  photoId: string,
  isSmall: boolean,
): Promise<OpenedRequestPhoto> {
  if (account === null) return refused("not-signed-in");
  const which = whichOf(account, visible);
  if (which === null) return refused("not-allowed");
  // Where file keeping is off, no photo was kept.
  if (store === null || !isUuid(photoId)) return refused("not-found");

  const key = await keyWithin(db, which, photoId, isSmall);
  if (key === null) return refused("not-found");
  const bytes = await keptBytes(store, key);
  if (bytes === "unreachable") return refused("unreachable");
  if (bytes === null) return refused("not-found");
  return {
    ok: true,
    file: {
      name: REQUEST_PHOTO_FILE_NAME,
      contentType: JPEG.contentType,
      bytes,
    },
  };
}
