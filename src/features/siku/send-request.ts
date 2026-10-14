import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { sikuRequestPhotos, sikuRequests, students } from "@/db/schema";
import { type FileRule, fileFault, type SentFile } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import { parseRequest, type RequestInput } from "./request-input";
import {
  ASK_NOT_ALLOWED,
  NO_PHOTO_STORAGE,
  NOT_AN_ACTIVE_STUDENT,
  PHOTOS_NOT_KEPT,
  REQUEST_ALREADY_SENT,
  REQUEST_SENT,
} from "./request-messages";
import {
  REQUEST_PHOTO_FAULTS,
  REQUEST_PHOTO_FOLDER,
  REQUEST_PHOTO_RULE,
  REQUEST_THUMB_RULE,
} from "./request-photo";

/** One proof photo as the form sends it: large, and its small copy. */
export interface SentPhoto {
  photo: SentFile;
  thumb: SentFile;
}

/** A request as the form sends it: nothing in it is trusted. */
export interface SentRequest {
  reason: string;
  day: string;
  report: string;
  photos: SentPhoto[];
}

interface KeptPhoto {
  photoKey: string;
  thumbKey: string;
}

const SENT = { ok: true, value: REQUEST_SENT } as const;

function refusal(error: string) {
  return { ok: false, error } as const;
}

/** What is wrong with a sent photo or its small copy, in words, or null. */
function photoFault({ photo, thumb }: SentPhoto): string | null {
  const wrong =
    fileFault(photo, REQUEST_PHOTO_RULE) ??
    fileFault(thumb, REQUEST_THUMB_RULE);
  return wrong === null ? null : REQUEST_PHOTO_FAULTS[wrong];
}

function checked(sent: SentRequest, today: string): Parsed<RequestInput> {
  const parsed = parseRequest(
    { ...sent, photoCount: sent.photos.length },
    today,
  );
  if (!parsed.ok) return parsed;
  for (const photo of sent.photos) {
    const wrong = photoFault(photo);
    if (wrong !== null) return refusal(wrong);
  }
  return parsed;
}

async function isActive(db: Database, studentId: string): Promise<boolean> {
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), ACTIVE_MEMBER));
  return found !== undefined;
}

/**
 * What a request answers when its key is kept already, or null when it
 * is not: the same answer as the first time when it is this student's,
 * as a second press of "Kirim pengajuan" is the same request.
 */
async function answerOfKept(
  db: Database,
  id: string,
  studentId: string,
): Promise<Parsed<string> | null> {
  const [kept] = await db
    .select({ studentId: sikuRequests.studentId })
    .from(sikuRequests)
    .where(eq(sikuRequests.id, id));
  if (!kept) return null;
  return kept.studentId === studentId ? SENT : REQUEST_ALREADY_SENT;
}

async function keepOne(
  store: FileStore,
  file: SentFile,
  rule: FileRule,
): Promise<string> {
  const kept = await keepFile(store, REQUEST_PHOTO_FOLDER, file, rule);
  if (!kept.ok) throw new Error(`A checked photo was refused: ${kept.fault}.`);
  return kept.key;
}

/**
 * Removes kept photos that got no request. When the storage fails here
 * too the send is not made to fail for it: the photo stays, unreachable
 * by anyone, and the log says which one.
 */
async function dropPhotos(store: FileStore, keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      await store.remove(key);
    } catch (error) {
      console.error(`The kept photo ${key} has no request.`, error);
    }
  }
}

/**
 * Puts every photo and its small copy in the file storage. A storage
 * that fails or cannot be reached is not an error to pass on: what was
 * kept is removed again, the student is told to try again, and the cause
 * is logged, which names no person.
 */
async function keepPhotos(
  store: FileStore,
  photos: SentPhoto[],
): Promise<KeptPhoto[] | null> {
  const keys: string[] = [];
  const kept: KeptPhoto[] = [];
  try {
    for (const { photo, thumb } of photos) {
      const photoKey = await keepOne(store, photo, REQUEST_PHOTO_RULE);
      keys.push(photoKey);
      const thumbKey = await keepOne(store, thumb, REQUEST_THUMB_RULE);
      keys.push(thumbKey);
      kept.push({ photoKey, thumbKey });
    }
    return kept;
  } catch (error) {
    console.error("The photos of a SIKU request were not kept.", error);
    await dropPhotos(store, keys);
    return null;
  }
}

type NewRequest = Pick<
  typeof sikuRequests.$inferInsert,
  "id" | "studentId" | "reason" | "day" | "report" | "sentAt"
>;

/**
 * Adds a request that waits, with its photos, all or nothing. The
 * database keeps one request per key: a second at once waits here for
 * the first, then adds nothing. Says whether it was added.
 */
function addRequest(
  db: Database,
  request: NewRequest,
  photos: KeptPhoto[],
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const added = await tx
      .insert(sikuRequests)
      .values({ ...request, status: "waiting" })
      .onConflictDoNothing({ target: sikuRequests.id })
      .returning({ id: sikuRequests.id });
    if (added.length === 0) return false;
    await tx.insert(sikuRequestPhotos).values(
      photos.map((photo, at) => ({
        ...photo,
        requestId: request.id,
        place: at + 1,
      })),
    );
    return true;
  });
}

/**
 * "Kirim pengajuan": keeps a request for a SIKU gain of the account's
 * own student, to wait for Penilai Mahasiswa. Whose request it is comes
 * from the account, never from what was sent. Only an Aktif student may
 * ask, as gains are given to Aktif students only. `id` is the key the
 * form made: a request sent twice is kept once, and both answer the same.
 * The photos go to the file storage first and the request is saved
 * after; when that adds nothing they are removed again. `store` is null
 * where file keeping is off: nothing is saved there, and the student is
 * told so. `at` is the moment on the server's clock.
 */
export async function sendSikuRequest(
  db: Database,
  store: FileStore | null,
  actor: AccountForAccess,
  id: string,
  sent: SentRequest,
  at: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "ask_siku_addition")) return ASK_NOT_ALLOWED;
  const { studentId } = actor;
  if (studentId === null) return ASK_NOT_ALLOWED;
  const input = checked(sent, campusDay(at));
  if (!input.ok) return input;
  if (!isUuid(id)) return REQUEST_ALREADY_SENT;
  const before = await answerOfKept(db, id, studentId);
  if (before !== null) return before;
  if (!(await isActive(db, studentId))) return NOT_AN_ACTIVE_STUDENT;
  if (store === null) return NO_PHOTO_STORAGE;

  const photos = await keepPhotos(store, sent.photos);
  if (photos === null) return PHOTOS_NOT_KEPT;
  const request = { id, studentId, ...input.value, sentAt: at };
  let added = false;
  try {
    added = await addRequest(db, request, photos);
  } finally {
    if (!added) {
      const keys = photos.flatMap((photo) => [photo.photoKey, photo.thumbKey]);
      await dropPhotos(store, keys);
    }
  }
  if (added) return SENT;
  return (await answerOfKept(db, id, studentId)) ?? PHOTOS_NOT_KEPT;
}
