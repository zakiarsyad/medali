import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { AttendanceNumbers } from "./attendance-numbers";
import { shownPercent } from "./attendance-score";
import type { MeanScore } from "./mean-score";
import type { ScheduleKind } from "./schedule-list-address";
import { shownCount } from "./schedule-words";

/**
 * The line under Rerata nilai kehadiran: how many students it is the mean
 * of, over activities and meetings alike.
 */
export function meanNote(mean: MeanScore): string {
  return `${shownCount(mean.students)} mahasiswa, semua jenis kegiatan`;
}

/** What Kegiatan terlaksana counts on each tab. */
const HELD_NOTES: Record<ScheduleKind, string> = {
  ppks: "PPKS wajib",
  extra: "tambahan wajib",
};

/** The four numbers above the list of schedules of a tab. */
export function AttendanceNumbersView({
  numbers,
  kind,
}: {
  numbers: AttendanceNumbers;
  kind: ScheduleKind;
}) {
  const { mean, held, waiting, coming } = numbers;
  return (
    <NumberCards>
      <NumberCard
        label="Rerata nilai kehadiran"
        amount={shownPercent(mean.percent)}
        note={meanNote(mean)}
      />
      <NumberCard
        label="Kegiatan terlaksana"
        amount={held}
        note={HELD_NOTES[kind]}
      />
      <NumberCard
        label="Menunggu verifikasi"
        amount={waiting}
        note="foto kehadiran"
      />
      <NumberCard label="Terjadwal" amount={coming} note="akan datang" />
    </NumberCards>
  );
}
