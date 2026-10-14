import type {
  AcceptedAs,
  DormClarificationReason,
  DormClarificationStatus,
} from "@/features/dorm/clarification-ids";
import { WITHDRAWN_NOTE } from "@/features/dorm/clarification-words";
import {
  afterEnd,
  type KeptSampleCount,
  nextMorning,
  type SampleResident,
} from "./sample-dorm-counts";
import { SAMPLE_LEAVE_RESIDENTS } from "./sample-dorm-leaves";

/*
 * Made-up people only. Every clarification here is invented, and its
 * file is a drawn paper that names nobody.
 */

/** A check or a decision of a sample clarification: when, and the note. */
export interface SampleCheck {
  at: Date;
  note: string;
}

export interface SampleDormClarification {
  countId: string;
  studentId: string;
  reason: DormClarificationReason;
  explanation: string;
  status: DormClarificationStatus;
  acceptedAs: AcceptedAs | null;
  sentAt: Date;
  /** The check of BAM, or null when there was none. */
  verified: SampleCheck | null;
  /**
   * The last word, or null when there is none yet: Pengelola Asrama's
   * decision, or BAM's announcement that closed it.
   */
  decided: (SampleCheck & { by: "manager" | "bam" }) | null;
}

/** What becomes of an absence, in turn, for the residents without sample leave. */
type Outcome =
  | "not_asked"
  | "submitted"
  | "verified"
  | "accepted_present"
  | "rejected_by_bam"
  | "accepted_leave"
  | "rejected_by_manager";

/**
 * The first absence is left to clarify, so the resident it belongs to
 * can try "Ajukan klarifikasi"; every later one past these is left too.
 */
const OUTCOMES: Outcome[] = [
  "not_asked",
  "submitted",
  "verified",
  "accepted_present",
  "rejected_by_bam",
  "accepted_leave",
  "rejected_by_manager",
];

const REQUESTS: { reason: DormClarificationReason; explanation: string }[] = [
  {
    reason: "sick",
    explanation:
      "Demam sejak sore dan beristirahat di kamar atas saran klinik asrama.",
  },
  {
    reason: "present_not_recorded",
    explanation:
      "Hadir sampai kegiatan selesai, tetapi tidak tercatat; disaksikan ketua kamar.",
  },
  {
    reason: "family_matter",
    explanation: "Menerima kunjungan orang tua yang datang mendadak.",
  },
  {
    reason: "campus_duty",
    explanation:
      "Mengikuti rapat panitia lomba kampus yang berlangsung pada jam yang sama.",
  },
  {
    reason: "other",
    explanation: "Mengantar teman sekamar ke klinik asrama karena sakit.",
  },
];

const VERIFY_NOTE = "Dikonfirmasi ketua kamar.";
const BAM_REJECTION = "Tidak ada surat keterangan dari klinik asrama.";
const MANAGER_REJECTION = "Alasan tidak dapat diterima untuk kegiatan wajib.";

const HOUR_MS = 60 * 60 * 1000;

/** Some hours after a moment, but never after now. */
function hoursAfter(moment: Date, hours: number, now: Date): Date {
  const later = moment.getTime() + hours * HOUR_MS;
  return new Date(Math.min(later, now.getTime()));
}

interface Absence {
  countId: string;
  studentId: string;
  place: number;
  sentAt: Date;
}

/**
 * The announced absences of the residents without sample leave, by the
 * place of the resident's name and then the latest first, so the first
 * of them has several. A resident on leave would show Izin, not Tidak
 * hadir, so theirs are left out.
 */
function absencesToClarify(
  counts: KeptSampleCount[],
  residents: SampleResident[],
  now: Date,
): Absence[] {
  const absences: Absence[] = [];
  for (const { id, count } of counts) {
    if (count.stage === "draft") continue;
    for (const [studentId, mark] of Object.entries(count.marks)) {
      const place = residents.findIndex((each) => each.id === studentId);
      if (!mark.isAbsent || place < SAMPLE_LEAVE_RESIDENTS) continue;
      const sentAt = hoursAfter(afterEnd(count), 2, now);
      absences.push({ countId: id, studentId, place, sentAt });
    }
  }
  return absences.sort(
    (a, b) => a.place - b.place || b.sentAt.getTime() - a.sentAt.getTime(),
  );
}

/** A sample clarification of an absence that ended as `outcome`. */
function clarificationOf(
  absence: Absence,
  outcome: Exclude<Outcome, "not_asked">,
  place: number,
  now: Date,
): SampleDormClarification {
  const request = REQUESTS[place % REQUESTS.length] ?? REQUESTS[0];
  if (!request) throw new Error("There are no sample requests.");
  const { place: _place, ...asked } = absence;
  const base = { ...asked, ...request, acceptedAs: null, decided: null };
  const checkedAt = hoursAfter(absence.sentAt, 2, now);
  const decidedAt = hoursAfter(checkedAt, 2, now);
  const verified = { at: checkedAt, note: VERIFY_NOTE };
  if (outcome === "submitted") {
    return { ...base, status: "submitted", verified: null };
  }
  if (outcome === "verified") return { ...base, status: "verified", verified };
  if (outcome === "rejected_by_bam") {
    const rejection = { at: checkedAt, note: BAM_REJECTION };
    return { ...base, status: "rejected", verified: rejection };
  }
  if (outcome === "rejected_by_manager") {
    const note = MANAGER_REJECTION;
    const decided = { at: decidedAt, note, by: "manager" } as const;
    return { ...base, status: "rejected", verified, decided };
  }
  const acceptedAs = outcome === "accepted_present" ? "present" : "leave";
  const decided = { at: decidedAt, note: "", by: "manager" } as const;
  return { ...base, status: "accepted", acceptedAs, verified, decided };
}

/**
 * The clarification of the absence BAM withdrew when it corrected a
 * count: sent after the first announcement, and closed by the second.
 */
function withdrawnOf(counts: KeptSampleCount[]): SampleDormClarification[] {
  const closed: SampleDormClarification[] = [];
  for (const { id, count } of counts) {
    if (count.firstMarks === null) continue;
    for (const [studentId, first] of Object.entries(count.firstMarks)) {
      if (!first.isAbsent || count.marks[studentId]?.isAbsent !== false) {
        continue;
      }
      closed.push({
        countId: id,
        studentId,
        reason: "present_not_recorded",
        explanation:
          "Hadir sejak awal apel, tetapi tercatat tidak hadir; disaksikan ketua kamar.",
        status: "closed",
        acceptedAs: null,
        sentAt: new Date(afterEnd(count).getTime() + HOUR_MS),
        verified: null,
        decided: { at: nextMorning(count), note: WITHDRAWN_NOTE, by: "bam" },
      });
    }
  }
  return closed;
}

/**
 * The made-up clarifications of the sample counts, in every status: the
 * absences of the residents without sample leave get one after another
 * of the outcomes, and the absence BAM withdrew when it corrected a count
 * gets one that was closed by it. Each is sent two hours after its
 * activity's first announcement, and checked and decided two hours
 * apart, never after `now`. All are within the seven days of their
 * activity, as the sample counts are of the week before today.
 */
export function sampleDormClarifications(
  counts: KeptSampleCount[],
  residents: SampleResident[],
  now: Date,
): SampleDormClarification[] {
  const clarifications: SampleDormClarification[] = [];
  const absences = absencesToClarify(counts, residents, now);
  for (const [place, outcome] of OUTCOMES.entries()) {
    const absence = absences[place];
    if (absence === undefined) break;
    if (outcome === "not_asked") continue;
    clarifications.push(clarificationOf(absence, outcome, place, now));
  }
  return [...clarifications, ...withdrawnOf(counts)];
}
