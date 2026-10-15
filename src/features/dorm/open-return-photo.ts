import { and, eq, isNull, type SQL } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves, dormReturnReports, students } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import { JPEG } from "@/files/file-kinds";
import type { FileStore } from "@/files/file-store";
import { RETURN_PHOTO_FILE_NAME } from "./return-photo";

export type OpenedReturnPhoto =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedReturnPhoto {
  return { ok: false, refusal };
}

/** Which students' report photos an account may open. */
function whichOf(account: AccountForAccess, visible: SQL | null): SQL | null {
  if (visible !== null) return visible;
  if (!may(account.roles, "report_dorm_return")) return null;
  if (account.studentId === null) return null;
  return eq(students.id, account.studentId);
}

/** Where the photo of a report is kept, when its student is among `which`. */
async function photoKeyWithin(
  db: Database,
  which: SQL,
  reportId: string,
): Promise<string | null> {
  const [report] = await db
    .select({ photoKey: dormReturnReports.photoKey })
    .from(dormReturnReports)
    .innerJoin(dormLeaves, eq(dormLeaves.id, dormReturnReports.leaveId))
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .where(
      and(
        eq(dormReturnReports.id, reportId),
        isNull(dormReturnReports.fileRemovedAt),
        which,
      ),
    );
  return report?.photoKey ?? null;
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
    console.error("A kept return photo was not opened.", error);
    return "unreachable";
  }
}

/**
 * The photo of a report of a return, for the accounts that may open it:
 * the resident who sent it, and staff who may see that leave, among the
 * students `visible` holds, which the caller reads from the right to see
 * dorm leave: for Ketua Program Studi those of their own program only.
 * `visible` is null for an account without that right. The photo of a
 * report out of reach answers as one that does not exist, so nobody
 * learns which reports there are. `account` is null for a visitor who is
 * not signed in, and `id` comes from the address and is not trusted.
 */
export async function openReturnPhoto(
  db: Database,
  store: FileStore | null,
  account: AccountForAccess | null,
  visible: SQL | null,
  id: string,
): Promise<OpenedReturnPhoto> {
  if (account === null) return refused("not-signed-in");
  const which = whichOf(account, visible);
  if (which === null) return refused("not-allowed");
  // Where file keeping is off, no photo was kept.
  if (store === null || !isUuid(id)) return refused("not-found");

  const photoKey = await photoKeyWithin(db, which, id);
  if (photoKey === null) return refused("not-found");
  const bytes = await keptBytes(store, photoKey);
  if (bytes === "unreachable") return refused("unreachable");
  if (bytes === null) return refused("not-found");
  return {
    ok: true,
    file: {
      name: RETURN_PHOTO_FILE_NAME,
      contentType: JPEG.contentType,
      bytes,
    },
  };
}
