import { stageNameOf } from "@/academic-periods/stages";
import type { SavedSchedule, SavedTarget } from "./schedule-row";
import { choiceWords, shownCount } from "./schedule-words";

/** The question asked before a schedule is removed. */
export const REMOVAL_QUESTION =
  "Hapus jadwal kegiatan ini? Presensi yang sudah masuk tidak lagi dihitung.";

/** What the list says once a schedule is removed. */
export const REMOVED_WORDS = "Jadwal dihapus.";

/** Whom a saved schedule is for, in the middle of a sentence. */
function savedTargetWords(target: SavedTarget): string {
  if (target.kind === "chosen") {
    const words = choiceWords(target.choice);
    return words.charAt(0).toLowerCase() + words.slice(1);
  }
  const stage = stageNameOf(target.semester).toLowerCase();
  return `semester ${target.semester} (${stage})`;
}

/** What the list says once a schedule is saved. */
export function savedWords(saved: SavedSchedule): string {
  return `Jadwal "${saved.name}" disimpan untuk ${savedTargetWords(saved.target)}.`;
}

/** The line of the form of an extra activity that counts its students. */
export function chosenCountWords(participants: number): string {
  return `Sasaran: ${shownCount(participants)} mahasiswa.`;
}

/** The line of the form that says whom the schedule is for. */
export function formTargetWords(
  participants: number,
  target: number | null,
): string {
  const counted = `Sasaran: ${shownCount(participants)} mahasiswa`;
  const aim = target === null ? "" : ` (target ${shownCount(target)})`;
  return `${counted}${aim}. Mahasiswa mengunggah foto kehadiran sejak kegiatan dimulai sampai batas rentang unggah; satu foto tervalidasi dihitung hadir.`;
}

/** The target of a chosen activity, or nothing for one without a target. */
export function activityTargetWords(target: number | null): string {
  if (target === null) return "";
  return `target ${shownCount(target)} peserta`;
}

/** The label of a group of choices, such as Semester 3 (Penumbuhan). */
export function semesterGroupWords(semester: number): string {
  return `Semester ${semester} (${stageNameOf(semester)})`;
}
