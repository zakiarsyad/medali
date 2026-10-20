import { NumberCard, NumberCards } from "@/ui/number-cards";
import { type GradeNumbers, passingPercent } from "./grade-numbers";
import { shownOneDecimal } from "./grade-words";
import type { GradeLetter } from "./scheme-ids";

function shown(count: number): string {
  return count.toLocaleString("id-ID");
}

function shownShare(percent: number | null): string {
  if (percent === null) return "-";
  return `${shown(percent)}%`;
}

/** The four numbers above "Skema bobot". */
export function GradeNumberCards({
  numbers,
  passLetter,
  sikuBase,
}: {
  numbers: GradeNumbers;
  passLetter: GradeLetter;
  sikuBase: number;
}) {
  const notPassing = numbers.complete - numbers.passing;
  return (
    <NumberCards>
      <NumberCard
        label="Rerata nilai akhir"
        amount={shownOneDecimal(numbers.meanFinal)}
        note={`${shown(numbers.complete)} dari ${shown(numbers.students)} mahasiswa aktif`}
      />
      <NumberCard
        label={`Memenuhi minimal ${passLetter}`}
        amount={shownShare(passingPercent(numbers))}
        note={`${shown(notPassing)} belum memenuhi`}
      />
      <NumberCard
        label="Mendapat penyesuaian SIKU"
        amount={numbers.adjusted}
        note={`sisanya SIKU dasar ${shown(sikuBase)}`}
      />
      <NumberCard
        label="Belum lengkap"
        amount={numbers.incomplete}
        note="tidak dihitung dalam rerata"
      />
    </NumberCards>
  );
}
