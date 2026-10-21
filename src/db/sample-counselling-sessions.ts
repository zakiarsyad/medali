import type { CounsellingTopic } from "@/features/counselling/schedule-ids";
import type { FollowUp, SessionKind } from "@/features/counselling/session-ids";

/*
 * Made-up counselling sessions only, for the made-up students.
 */

/** A session the sample Konselor wrote down for a sample student. */
export interface SampleSession {
  nim: string;
  /** How many days before today it was held and written down. */
  daysAgo: number;
  /**
   * Written when the student's Selesai session was marked, `daysAgo`: it
   * takes the day of that session.
   */
  forDoneSchedule: boolean;
  kind: SessionKind;
  topic: CounsellingTopic;
  notes: string;
  followUp: FollowUp;
  /** How many days after today "Sesi berikutnya" falls, when one is set. */
  nextInDays: number | null;
  /**
   * The notes it was first written with, when it was changed the day
   * after; null for one never changed.
   */
  firstNotes: string | null;
}

function session(
  nim: string,
  daysAgo: number,
  rest: Partial<SampleSession> = {},
): SampleSession {
  return {
    nim,
    daysAgo,
    forDoneSchedule: false,
    kind: "individual_in_person",
    topic: "emotions_and_stress",
    notes: "Mahasiswa bercerita tentang kesehariannya. Suasana hati stabil.",
    followUp: "monitoring",
    nextInDays: null,
    firstNotes: null,
    ...rest,
  };
}

/**
 * Fikri Wibowo met Konselor every three days before he withdrew his
 * consent 6 days ago: 11 sessions, so "Riwayat sesi" loads more, and can
 * be read but not changed.
 */
const FIKRI_SESSIONS: SampleSession[] = Array.from({ length: 11 }, (_, place) =>
  session("9900230006", 37 - place * 3, {
    kind: place % 2 === 0 ? "individual_in_person" : "individual_online",
    notes: `Pertemuan ke-${place + 1}. Mahasiswa berlatih mengatur waktu belajar dan istirahat.`,
    followUp: "next_session",
  }),
);

/**
 * Bayu Santoso's Selesai session was written down when it was marked,
 * and changed the day after; a later one sets the next session. Citra
 * Nasution had one group session, and Dimas Halim one session after he
 * registered, so all three can be asked to share it. Nanda Gunawan had
 * one with a next session set, which he shared. Every other student has
 * none.
 */
export const SAMPLE_SESSIONS: SampleSession[] = [
  session("9900240002", 11, {
    forDoneSchedule: true,
    topic: "academic",
    notes:
      "Mahasiswa cemas menghadapi ujian. Disepakati jadwal belajar harian.",
    followUp: "next_session",
    firstNotes: "Mahasiswa cemas menghadapi ujian.",
  }),
  session("9900240002", 5, {
    kind: "individual_online",
    topic: "academic",
    notes: "Jadwal belajar berjalan. Tidur lebih teratur.",
    followUp: "next_session",
    nextInDays: 7,
  }),
  session("9900250003", 9, {
    kind: "group",
    topic: "campus_adjustment",
    notes: "Sesi kelompok tentang adaptasi kampus. Mahasiswa aktif berbagi.",
    followUp: "closed",
  }),
  session("9900240004", 4, {
    topic: "family",
    notes: "Mahasiswa bercerita tentang kabar keluarga di kampung halaman.",
    followUp: "monitoring",
  }),
  session("9900240014", 8, {
    topic: "academic",
    notes: "Mahasiswa menyusun ulang jadwal belajar menjelang ujian.",
    followUp: "next_session",
    nextInDays: 6,
  }),
  ...FIKRI_SESSIONS,
];
