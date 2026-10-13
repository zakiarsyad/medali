import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { AttendanceNumbers } from "./attendance-numbers";
import { shownPercent } from "./attendance-score";
import type { MeanScore } from "./mean-score";
import { shownCount } from "./schedule-words";

/** The line under Rerata nilai kehadiran: how many students it is the mean of. */
export function meanNote(mean: MeanScore): string {
  return `${shownCount(mean.students)} mahasiswa`;
}

/** The four numbers above the list of schedules. */
export function AttendanceNumbersView({
  numbers,
}: {
  numbers: AttendanceNumbers;
}) {
  const { mean, held, waiting, coming } = numbers;
  return (
    <NumberCards>
      <NumberCard
        label="Rerata nilai kehadiran"
        amount={shownPercent(mean.percent)}
        note={meanNote(mean)}
      />
      <NumberCard label="Kegiatan terlaksana" amount={held} note="PPKS wajib" />
      <NumberCard
        label="Menunggu verifikasi"
        amount={waiting}
        note="foto kehadiran"
      />
      <NumberCard label="Terjadwal" amount={coming} note="akan datang" />
    </NumberCards>
  );
}
