import { stageNameOf } from "@/academic-periods/stages";
import { shownCount } from "./schedule-words";

/** What the list says once a schedule is saved. */
export function savedWords(name: string, semester: number): string {
  const stage = stageNameOf(semester).toLowerCase();
  return `Jadwal "${name}" disimpan untuk semester ${semester} (${stage}).`;
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
