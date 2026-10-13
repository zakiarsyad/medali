import { and, eq, isNull } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  mentorGroupMentors,
  mentorGroups,
  mentoringMeetings,
} from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import {
  isMeetingNumber,
  type MarksByStudent,
  MEETINGS_PER_PERIOD,
} from "@/mentoring/meeting-ids";
import type { Parsed } from "@/parsed";
import { mayFillInFor } from "./attendance-groups";
import { type AttendanceInput, NOT_SAVED_YET } from "./attendance-input";
import { listActiveMembers } from "./group-meetings";
import { meetingDayFault } from "./meeting-day";
import { filledRowsFor } from "./visible-attendance";
import { addMeeting, correctMeeting } from "./write-attendance";

/** What a save answers to any role but Pengasuh. */
export const NOT_ALLOWED_TO_FILL_IN = {
  ok: false,
  error: "Daftar hadir pertemuan hanya diisi oleh pengasuh.",
} as const;

/**
 * What a save answers for every group the sender does not hold today: one
 * of another mentor, one they held before, one that is ended and one that
 * does not exist. The one answer tells nothing about a group the sender
 * may not see.
 */
export const GROUP_NOT_HELD = {
  ok: false,
  error:
    "Kelompok ini tidak Anda asuh saat ini, sehingga daftar hadirnya tidak dapat Anda isi. Muat ulang halaman, lalu pilih kelompok yang Anda asuh.",
} as const;

export const NO_SUCH_MEETING = {
  ok: false,
  error: `Pertemuan ini tidak ada. Setiap semester ada ${MEETINGS_PER_PERIOD} pertemuan.`,
} as const;

export const NO_RUNNING_PERIOD = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, sehingga daftar hadir belum dapat disimpan.",
} as const;

/**
 * What a save answers when the list is not that of the group today: it
 * marks someone who is no Aktif member of the group, or leaves a member
 * out.
 */
export const NOT_THE_MEMBERS = {
  ok: false,
  error:
    "Daftar hadir tidak sesuai dengan anak asuh aktif kelompok ini saat ini. Muat ulang halaman, lalu isi lagi.",
} as const;

/**
 * What a save answers when the list kept for the meeting is not the one
 * the form was opened on: it was saved in between, by a second press or
 * from another window.
 */
export const MEETING_CHANGED = {
  ok: false,
  error:
    "Daftar hadir pertemuan ini sudah berubah sejak formulir dibuka, jadi isian Anda tidak disimpan. Muat ulang halaman untuk melihat isinya yang terbaru, lalu ubah lagi bila masih perlu.",
} as const;

/** What "Simpan daftar hadir" tells the one who saved. */
export interface SavedAttendance {
  number: number;
  /** Which save of the list is kept now, for the form to send next. */
  version: number;
}

/**
 * Reads a group that is in force and holds it until the transaction ends,
 * so two saves for one group never run at the same moment: the second
 * waits, and then sees what the first one saved. Held without its key, so
 * nothing that only names the group has to wait.
 */
async function lockGroup(tx: Database, groupId: string): Promise<boolean> {
  const [group] = await tx
    .select({ id: mentorGroups.id })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, groupId), NOT_ENDED))
    .for("no key update");
  return group !== undefined;
}

/** The account that holds a group today, or null for a group without a mentor. */
async function readMentorOfToday(
  tx: Database,
  groupId: string,
): Promise<string | null> {
  const [line] = await tx
    .select({ mentorId: mentorGroupMentors.mentorId })
    .from(mentorGroupMentors)
    .where(
      and(
        eq(mentorGroupMentors.groupId, groupId),
        isNull(mentorGroupMentors.endsOn),
      ),
    );
  return line?.mentorId ?? null;
}

/** Whether a list holds a mark for each of these members and for nobody else. */
export function marksExactly(
  marks: MarksByStudent,
  memberIds: readonly string[],
): boolean {
  const marked = Object.keys(marks);
  if (marked.length !== memberIds.length) return false;
  return memberIds.every((id) => Object.hasOwn(marks, id));
}

async function findMeeting(
  tx: Database,
  periodId: string,
  input: AttendanceInput,
) {
  const [stored] = await tx
    .select()
    .from(mentoringMeetings)
    .where(
      and(
        eq(mentoringMeetings.groupId, input.groupId),
        eq(mentoringMeetings.periodId, periodId),
        eq(mentoringMeetings.number, input.number),
      ),
    );
  return stored ?? null;
}

/**
 * "Simpan daftar hadir": keeps the attendance list of one meeting of a
 * group in the period that runs on `day`, as the work of the actor, with
 * a line in the log. The first save of a meeting adds it; a later one,
 * by whoever holds the group then, puts the new list in its place.
 * Refused for any role but Pengasuh, for a group the actor does not hold
 * today, for a number no meeting of a period has, for a day in the future
 * or outside the period, for a list that is not that of the Aktif members
 * of the group today, and for a form that was opened on another state of
 * the meeting than the one kept now: a second press, or a second window.
 */
export async function saveAttendance(
  db: Database,
  actor: AccountForAccess,
  input: AttendanceInput,
  day: string = campusDay(),
): Promise<Parsed<SavedAttendance>> {
  const limit = filledRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_FILL_IN;
  if (!isMeetingNumber(input.number)) return NO_SUCH_MEETING;

  return db.transaction(async (tx) => {
    if (!(await lockGroup(tx, input.groupId))) return GROUP_NOT_HELD;
    const mentorId = await readMentorOfToday(tx, input.groupId);
    if (!mayFillInFor(limit, mentorId)) return GROUP_NOT_HELD;
    const period = await readRunningPeriod(tx, day);
    if (period === null) return NO_RUNNING_PERIOD;
    const dayError = meetingDayFault(input.heldOn, period, day);
    if (dayError !== null) return { ok: false, error: dayError };
    const members = await listActiveMembers(tx, input.groupId);
    const memberIds = members.map((member) => member.id);
    if (!marksExactly(input.marks, memberIds)) return NOT_THE_MEMBERS;

    const kept = await findMeeting(tx, period.id, input);
    if ((kept?.version ?? NOT_SAVED_YET) !== input.version) {
      return MEETING_CHANGED;
    }
    const version =
      kept === null
        ? await addMeeting(tx, actor.id, period.id, input)
        : await correctMeeting(tx, actor.id, kept, input);
    return { ok: true, value: { number: input.number, version } };
  });
}
