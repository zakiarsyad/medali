import { DAY, shownDay } from "@/ui/day";
import type { CallSchedule, ProposalStatus, WarningLevel } from "./warning-ids";

/*
 * How the calls and warning letters of the dorm are said on screen. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const NOT_SCHEDULED = "Belum dijadwalkan";

/** The schedule of a call as a row shows it, such as 16 Okt 2026 16:00 · Kantor Pengelola Asrama. */
export function scheduleWords(schedule: CallSchedule | null): string {
  if (schedule === null) return NOT_SCHEDULED;
  return `${shownDay(schedule.day)} ${schedule.time} · ${schedule.place}`;
}

/** Why a resident is called, as one line: the causes joined by "dan". */
export function causeWords(causes: string[]): string {
  return causes.join(" dan ");
}

export const WILL_BE_SCHEDULED =
  "Pengelola Asrama akan menjadwalkan klarifikasi.";

/** What the resident is told of their call. */
export function callWords(schedule: CallSchedule | null): string {
  if (schedule === null) return WILL_BE_SCHEDULED;
  return `Hadir untuk klarifikasi pada ${shownDay(schedule.day)} pukul ${schedule.time} di ${schedule.place}.`;
}

const PROPOSED =
  "Pengelola Asrama mengajukan proses hukuman disiplin ke Kepala Unit Pembangunan Karakter.";

/** The end of a sentence or spaces, which the sentence of the result puts back once. */
const TRAILING_STOPS = /[.\s]+$/;

/** How a status of a discipline proposal is said on screen. */
export const PROPOSAL_STATUS_WORDS: Record<ProposalStatus, string> = {
  proposed: "Diajukan",
  handled: "Diproses",
};

/**
 * What follows "Anda menerima Surat Peringatan N": the day it was issued
 * on campus and Hasil klarifikasi, and for SP 2 the proposal with its
 * status.
 */
export function receivedWords(letter: {
  level: WarningLevel;
  issuedAt: Date;
  result: string;
  /** Of SP 2 only; null for SP 1. */
  proposal: ProposalStatus | null;
}): string {
  const result = letter.result.replace(TRAILING_STOPS, "");
  const said = `pada ${DAY.format(letter.issuedAt)}. Hasil klarifikasi: ${result}.`;
  if (letter.level === 1 || letter.proposal === null) return said;
  return `${said} ${PROPOSED} Status pengajuan: ${PROPOSAL_STATUS_WORDS[letter.proposal]}.`;
}

/** A sentence that ends once, however the text was written. */
function sentence(text: string): string {
  return `${text.replace(TRAILING_STOPS, "")}.`;
}

/**
 * An SP as staff read it in the box of one student: the SP and its day
 * on campus, with Hasil klarifikasi and the proposal note when the
 * account may read them, null otherwise.
 */
export function issuedWords(letter: {
  level: WarningLevel;
  issuedAt: Date;
  result: string | null;
  proposalNote: string | null;
}): string {
  const parts = [
    `Surat Peringatan ${letter.level} terbit pada ${DAY.format(letter.issuedAt)}.`,
  ];
  if (letter.result !== null) {
    parts.push(`Hasil klarifikasi: ${sentence(letter.result)}`);
  }
  if (letter.proposalNote !== null && letter.proposalNote !== "") {
    parts.push(
      `Catatan pengajuan hukuman disiplin ke Kepala UPK: ${sentence(letter.proposalNote)}`,
    );
  }
  return parts.join(" ");
}

/** The button that issues an SP of `level`. */
export function issueButtonWords(level: WarningLevel): string {
  if (level === 1) return "Terbitkan SP 1";
  return "Terbitkan SP 2 dan ajukan hukuman disiplin";
}

const CANNOT_BE_UNDONE =
  "SP yang sudah terbit tidak dapat diubah atau ditarik.";

/** What is asked before a proposal is marked Diproses, as it cannot be undone. */
export function handleQuestion(name: string): string {
  return `Tandai pengajuan hukuman disiplin ${name} diproses? Catatan tindak lanjut tidak dapat diubah setelahnya.`;
}

/** What is asked before an SP is issued, as it cannot be undone. */
export function issueQuestion(name: string, level: WarningLevel): string {
  if (level === 1) return `Terbitkan SP 1 untuk ${name}? ${CANNOT_BE_UNDONE}`;
  return `Terbitkan SP 2 untuk ${name} dan ajukan hukuman disiplin ke Kepala UPK? ${CANNOT_BE_UNDONE}`;
}
