import { NumberCard, NumberCards } from "@/ui/number-cards";
import { shownCount } from "./schedule-words";
import type { VerificationNumbers } from "./verification-numbers";

/** The four numbers above the photo cards. */
export function VerificationNumbersView({
  numbers,
}: {
  numbers: VerificationNumbers;
}) {
  return (
    <NumberCards>
      <NumberCard
        label="Menunggu verifikasi"
        amount={numbers.waiting}
        note="foto kehadiran"
      />
      <NumberCard
        label="Divalidasi hari ini"
        amount={numbers.validToday}
        note="presensi"
      />
      <NumberCard
        label="Ditolak"
        amount={numbers.rejected}
        note="perlu kirim ulang"
      />
      <NumberCard
        label="Kegiatan hari ini"
        amount={numbers.heldToday}
        note={`${shownCount(numbers.openNow)} sedang dibuka`}
      />
    </NumberCards>
  );
}
