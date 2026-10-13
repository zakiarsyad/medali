import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import {
  isMeetingNumber,
  type MarksByStudent,
  MEETINGS_PER_PERIOD,
} from "@/mentoring/meeting-ids";
import type { Parsed } from "@/parsed";
import { isAttendanceMark } from "./attendance-marks";

/** A mark as the form sends it: the id of the student, then the mark. */
type SentMark = [studentId: string, mark: string];

/** "Simpan daftar hadir" as the form sends it. */
export interface SentAttendance {
  groupId: string;
  number: string;
  heldOn: string;
  topic: string;
  /** Which save of the list the form was opened on. */
  version: string;
  marks: SentMark[];
}

export interface AttendanceInput {
  groupId: string;
  /** Which meeting of the period: 1 to the last. */
  number: number;
  heldOn: string;
  topic: string;
  /**
   * Which save of the list the form was opened on, counted from 1, or
   * `NOT_SAVED_YET` for a meeting that had no list then.
   */
  version: number;
  marks: MarksByStudent;
}

/** The version a form sends for a meeting that had no list when it opened. */
export const NOT_SAVED_YET = 0;

export const TOPIC_MAX_LENGTH = 200;

/** What the name of a field that holds a student's mark starts with. */
const MARK_FIELD_START = "mark.";

/** The name of the field that holds the mark of one student. */
export function markField(studentId: string): string {
  return `${MARK_FIELD_START}${studentId}`;
}

/** The marks a sent form holds, one for each field of a student. */
export function sentMarks(form: FormData): SentMark[] {
  const marks: SentMark[] = [];
  for (const [name, value] of form.entries()) {
    if (!name.startsWith(MARK_FIELD_START)) continue;
    const mark = typeof value === "string" ? value : "";
    marks.push([name.slice(MARK_FIELD_START.length), mark]);
  }
  return marks;
}

/** The database keeps no text with this character. */
const NUL = "\u0000";
const WHOLE_NUMBER = /^\d$/;
/** As many digits as the database keeps for a version. */
const VERSION = /^\d{1,9}$/;

const INCOMPLETE =
  "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function topicFault(topic: string): string | null {
  if (topic === "") return "Isi topik pertemuan.";
  if (topic.includes(NUL)) {
    return "Topik memuat karakter yang tidak dapat disimpan. Ketik ulang topik, lalu simpan lagi.";
  }
  if (topic.length > TOPIC_MAX_LENGTH) {
    return `Topik paling panjang ${TOPIC_MAX_LENGTH} karakter.`;
  }
  return null;
}

/** The mark of each student, or null when a mark or a student is not one, or is there twice. */
function readMarks(sent: SentMark[]): MarksByStudent | null {
  const marks: MarksByStudent = {};
  for (const [studentId, mark] of sent) {
    const isTwice = Object.hasOwn(marks, studentId);
    if (isTwice || !isUuid(studentId) || !isAttendanceMark(mark)) return null;
    marks[studentId] = mark;
  }
  return marks;
}

/**
 * Checks "Simpan daftar hadir" as sent. The topic holds 1 to 200
 * characters, the meeting is one of the period, and every mark is one of
 * the four for one student. Whether the day falls in the running period,
 * whether the group and its members are the sender's, and whether the
 * form was opened on the list kept now, is decided where the list is
 * saved.
 */
export function parseAttendance(sent: SentAttendance): Parsed<AttendanceInput> {
  const isWhole = isUuid(sent.groupId) && VERSION.test(sent.version);
  if (!isWhole) return refused(INCOMPLETE);
  const number = WHOLE_NUMBER.test(sent.number) ? Number(sent.number) : 0;
  if (!isMeetingNumber(number)) {
    return refused(
      `Pertemuan ini tidak ada. Setiap semester ada ${MEETINGS_PER_PERIOD} pertemuan.`,
    );
  }
  if (!isDay(sent.heldOn)) {
    return refused("Isi tanggal pertemuan dengan benar.");
  }
  const topic = sent.topic.trim();
  const topicError = topicFault(topic);
  if (topicError !== null) return refused(topicError);
  const marks = readMarks(sent.marks);
  if (marks === null) {
    return refused(
      "Daftar hadir tidak lengkap. Muat ulang halaman, lalu isi lagi.",
    );
  }
  return {
    ok: true,
    value: {
      groupId: sent.groupId,
      number,
      heldOn: sent.heldOn,
      topic,
      version: Number(sent.version),
      marks,
    },
  };
}
