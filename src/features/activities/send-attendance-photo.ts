import { sql } from "drizzle-orm";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { activityAttendances } from "@/db/schema";
import { fileFault, type SentFile } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Parsed } from "@/parsed";
import { PHOTO_FAULTS, PHOTO_FOLDER, PHOTO_RULE } from "./attendance-photo";
import { takesNewPhoto } from "./attendance-status";
import { readOwnSchedule } from "./own-schedule";
import { readOwnStudent } from "./own-student";
import { scheduleStatus } from "./schedule-status";
import { readOwnAttendances } from "./student-schedules";

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const PHOTO_NOT_ALLOWED = refusal(
  "Anda tidak berhak mengunggah foto kehadiran.",
);

/** One answer for a schedule that is unknown, removed, or of others. */
export const NOT_OWN_ACTIVITY = refusal(
  "Kegiatan ini tidak ada dalam jadwal Anda. Muat ulang halaman, lalu pilih kegiatan dari daftar.",
);

export const UPLOAD_CLOSED = refusal("Masa unggah foto sudah ditutup.");

export const UPLOAD_NOT_OPEN = refusal(
  "Masa unggah foto belum dibuka. Unggah foto setelah kegiatan dimulai.",
);

export const ALREADY_DECIDED = refusal(
  "Kehadiran Anda pada kegiatan ini sudah diperiksa, sehingga foto baru tidak disimpan.",
);

/** Said where file keeping is off: on a preview without file storage. */
export const NO_PHOTO_STORAGE = refusal(
  "Foto belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan.",
);

export const PHOTO_NOT_KEPT = refusal("Foto tidak dapat disimpan. Coba lagi.");

export const PHOTO_SENT =
  "Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.";

const SENT = { ok: true, value: PHOTO_SENT } as const;

/**
 * What a send answers when the schedule takes no new photo from the
 * student, or null when it does: with nothing sent, and after their
 * newest photo was rejected. A photo that waits is not replaced: the
 * send is told its photo is there, as a second press of "Kirim presensi"
 * is the same send. A valid attendance or a dispensation stands.
 */
async function answerOfKept(
  db: Database,
  studentId: string,
  scheduleId: string,
): Promise<Parsed<string> | null> {
  const kept = await readOwnAttendances(db, studentId, [scheduleId]);
  const newest = kept.get(scheduleId)?.status ?? null;
  if (takesNewPhoto(newest)) return null;
  return newest === "waiting" ? SENT : ALREADY_DECIDED;
}

/**
 * Puts a photo in the file storage, checked once more on the way. A
 * storage that fails or cannot be reached is not an error to pass on:
 * the student is told to try again, and the cause is logged, which names
 * no person and no key.
 */
async function keepPhoto(
  store: FileStore,
  photo: SentFile,
): Promise<Parsed<string>> {
  try {
    const kept = await keepFile(store, PHOTO_FOLDER, photo, PHOTO_RULE);
    if (!kept.ok) return refusal(PHOTO_FAULTS[kept.fault]);
    return { ok: true, value: kept.key };
  } catch (error) {
    console.error("An attendance photo was not kept.", error);
    return PHOTO_NOT_KEPT;
  }
}

/**
 * Removes a kept photo that got no attendance. When the storage fails
 * here too the send is not made to fail for it: the photo stays,
 * unreachable by anyone, and the log says which one.
 */
async function dropPhoto(store: FileStore, photoKey: string): Promise<void> {
  try {
    await store.remove(photoKey);
  } catch (error) {
    console.error(`The kept photo ${photoKey} has no attendance.`, error);
  }
}

type NewAttendance = Pick<
  typeof activityAttendances.$inferInsert,
  "scheduleId" | "studentId" | "photoKey" | "sentAt"
>;

/**
 * Adds an attendance that waits, unless the student has a waiting or
 * valid one for the schedule: the database keeps one of those at most,
 * and a second add at the same moment waits for the first and then adds
 * nothing. Says whether it was added.
 */
async function addWaiting(
  db: Database,
  attendance: NewAttendance,
): Promise<boolean> {
  const added = await db
    .insert(activityAttendances)
    .values({ ...attendance, status: "waiting", note: "" })
    .onConflictDoNothing({
      target: [activityAttendances.scheduleId, activityAttendances.studentId],
      where: sql`status in ('waiting', 'valid')`,
    })
    .returning({ id: activityAttendances.id });
  return added.length > 0;
}

/**
 * Keeps an attendance photo of the student of an account for a schedule,
 * to wait for Pegawai UPK. Which student is never asked from outside: it
 * is the account's own. The schedule must be meant for them, and its
 * upload time open at `at`, the moment on the server's clock, in campus
 * time: what the phone says about the time is not asked. The photo goes
 * to the file storage first and its attendance is saved after; when that
 * adds nothing the photo is removed again, so one photo is kept however
 * often it is sent. `store` is null where file keeping is off: nothing
 * is saved there, and the student is told so.
 */
export async function sendAttendancePhoto(
  db: Database,
  store: FileStore | null,
  account: AccountForAccess,
  scheduleId: string,
  photo: SentFile,
  at: Date,
): Promise<Parsed<string>> {
  const student = await readOwnStudent(db, account);
  if (student === null) return PHOTO_NOT_ALLOWED;
  const fault = fileFault(photo, PHOTO_RULE);
  if (fault !== null) return refusal(PHOTO_FAULTS[fault]);
  const schedule = await readOwnSchedule(db, student, scheduleId);
  if (schedule === null) return NOT_OWN_ACTIVITY;
  const now = { day: campusDay(at), time: campusTime(at) };
  const status = scheduleStatus(schedule, now);
  if (status === "over") return UPLOAD_CLOSED;
  if (status !== "open") return UPLOAD_NOT_OPEN;
  const before = await answerOfKept(db, student.id, schedule.id);
  if (before !== null) return before;
  if (store === null) return NO_PHOTO_STORAGE;

  const kept = await keepPhoto(store, photo);
  if (!kept.ok) return kept;
  let added = false;
  try {
    added = await addWaiting(db, {
      scheduleId: schedule.id,
      studentId: student.id,
      photoKey: kept.value,
      sentAt: at,
    });
  } finally {
    if (!added) await dropPhoto(store, kept.value);
  }
  if (added) return SENT;
  // Another send of this student was saved in the meantime.
  const since = await answerOfKept(db, student.id, schedule.id);
  return since ?? PHOTO_NOT_KEPT;
}
