import { and, eq, isNull } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activityAttendances, activitySchedules } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import { JPEG } from "@/files/file-kinds";
import type { FileStore } from "@/files/file-store";
import { PHOTO_FILE_NAME } from "./attendance-photo";
import { mayVerify } from "./may-verify";
import { readOwnStudent } from "./own-student";

export type OpenedPhoto =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedPhoto {
  return { ok: false, refusal };
}

/** Whose photos an account may open: every student's, or one student's. */
type PhotoReach = { kind: "all" } | { kind: "own"; studentId: string };

/**
 * The photos an account may open: all of them with the right to verify
 * attendance, and its own student's otherwise. Null for anyone else.
 */
async function photoReachOf(
  db: Database,
  account: AccountForAccess,
): Promise<PhotoReach | null> {
  if (mayVerify(account)) return { kind: "all" };
  const student = await readOwnStudent(db, account);
  if (student === null) return null;
  return { kind: "own", studentId: student.id };
}

/**
 * Where the photo of an attendance is kept, when the attendance is within
 * reach and its schedule is not removed. Null otherwise, and for an
 * attendance without a photo.
 */
async function photoKeyWithin(
  db: Database,
  reach: PhotoReach,
  attendanceId: string,
): Promise<string | null> {
  const ofStudent =
    reach.kind === "own"
      ? eq(activityAttendances.studentId, reach.studentId)
      : undefined;
  const [attendance] = await db
    .select({ photoKey: activityAttendances.photoKey })
    .from(activityAttendances)
    .innerJoin(
      activitySchedules,
      eq(activitySchedules.id, activityAttendances.scheduleId),
    )
    .where(
      and(
        eq(activityAttendances.id, attendanceId),
        ofStudent,
        isNull(activitySchedules.deletedAt),
      ),
    );
  return attendance?.photoKey ?? null;
}

/**
 * A storage that fails or cannot be reached is not an error to pass on:
 * the person is told to try again, and the cause is logged, which names
 * no person and no key.
 */
async function keptBytes(
  store: FileStore,
  photoKey: string,
): Promise<Uint8Array | "unreachable" | null> {
  try {
    return await store.get(photoKey);
  } catch (error) {
    console.error("A kept attendance photo was not opened.", error);
    return "unreachable";
  }
}

/**
 * The photo of an attendance, for the accounts that may open it: the
 * student who sent it, and staff with the right to verify attendance.
 * The account is checked before anything is looked up, and the photo of
 * another student answers as one that does not exist, so nobody learns
 * which attendances there are. `null` is a visitor who is not signed in.
 * `id` comes from the address and is not trusted.
 */
export async function openAttendancePhoto(
  db: Database,
  store: FileStore | null,
  account: AccountForAccess | null,
  id: string,
): Promise<OpenedPhoto> {
  if (account === null) return refused("not-signed-in");
  const reach = await photoReachOf(db, account);
  if (reach === null) return refused("not-allowed");
  // Where file keeping is off, no photo was kept.
  if (store === null || !isUuid(id)) return refused("not-found");

  const photoKey = await photoKeyWithin(db, reach, id);
  if (photoKey === null) return refused("not-found");
  const bytes = await keptBytes(store, photoKey);
  if (bytes === "unreachable") return refused("unreachable");
  if (bytes === null) return refused("not-found");
  return {
    ok: true,
    file: { name: PHOTO_FILE_NAME, contentType: JPEG.contentType, bytes },
  };
}
