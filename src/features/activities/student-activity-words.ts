import { stageNameOf } from "@/academic-periods/stages";
import { shownDay, shownMoment } from "@/ui/day";
import { shownDays, shownHours } from "./schedule-words";
import type { StudentSchedule } from "./student-schedule";
import { type UploadRange, uploadDeadline } from "./upload-range";

const HOW_IT_WORKS =
  "Unggah foto kehadiran selama masa unggah dibuka, lalu Pegawai UPK memverifikasinya. Kehadiran yang tervalidasi menjadi nilai kehadiran kegiatan.";

/** The line under the title, which names the tahap of the student's semester. */
export function ledeWords(semester: number | null): string {
  if (semester === null) return `Kegiatan karakter untuk Anda. ${HOW_IT_WORKS}`;
  const stage = stageNameOf(semester).toLowerCase();
  return `Kegiatan tahap ${stage} untuk Anda. ${HOW_IT_WORKS}`;
}

/** The place of a schedule, or a dash when none was given. */
export function placeWords(location: string): string {
  return location === "" ? "-" : location;
}

/** The days, the hours and the place of a schedule, on one line. */
export function whenWords(
  schedule: Pick<
    StudentSchedule,
    "startsOn" | "endsOn" | "startTime" | "endTime" | "location"
  >,
): string {
  const days = shownDays(schedule.startsOn, schedule.endsOn);
  const hours = shownHours(schedule.startTime, schedule.endTime);
  return `${days}, ${hours} · ${placeWords(schedule.location)}`;
}

/** The last day a photo may be uploaded, such as 14 Okt 2026. */
export function lastUploadDay(range: UploadRange): string {
  return shownDay(uploadDeadline(range));
}

export function untilWords(range: UploadRange): string {
  return `Unggah foto sampai ${lastUploadDay(range)}`;
}

/** What a card says under a photo that waits, with the time the server kept. */
export function sentWords(sentAt: Date): string {
  return `Foto terunggah ${shownMoment(sentAt)}. Pegawai UPK akan memverifikasi.`;
}

/** What a card says of a rejected photo, with the reason when one was noted. */
export function rejectedWords(note: string): string {
  return `Presensi ditolak: ${note === "" ? "-" : note}.`;
}
