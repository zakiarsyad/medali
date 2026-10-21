import { shownMoment } from "@/ui/day";
import { ASSIGNMENT_TEXT_MAX } from "./schedule-ids";

/*
 * The words of mandatory counselling sent from a discipline penalty.
 * Read by the screen parts in the browser.
 */

export const ASSIGN_HEADING = "Tugaskan konseling wajib";

export const MESSAGE_LABEL = "Pesan untuk konselor (opsional)";

export const ASSIGN_BUTTON = "Tugaskan konseling";

export const ASSIGN_NOT_ALLOWED_WORDS =
  "Anda tidak memiliki hak untuk menugaskan konseling wajib.";

export const PENALTY_NOT_FOUND =
  "Hukuman disiplin ini tidak ditemukan. Muat ulang halaman.";

export const MESSAGE_TOO_LONG = `Pesan untuk konselor paling panjang ${ASSIGNMENT_TEXT_MAX} karakter.`;

export function assignedTo(name: string): string {
  return `Konseling wajib ditugaskan kepada ${name}.`;
}

/** The title of the box that shows how a Penugasan stands. */
export const BOX_TITLE = "Konseling wajib";

/** Why the box shows nothing of the session itself. */
export const SESSION_PRIVATE = "Isi sesi konseling hanya diketahui konselor.";

/** When and by whom it was sent, as the prototype says it. */
export function sentWords(at: Date, by: string): string {
  return `Ditugaskan ${shownMoment(at)} oleh ${by}.`;
}

/** Asked before it is sent, as the student is bound to a session. */
export function assignQuestion(name: string): string {
  return `Tugaskan ${name} ke konseling wajib? Mahasiswa wajib mengikuti sesi ini, dan penugasan tidak dapat dibatalkan.`;
}
