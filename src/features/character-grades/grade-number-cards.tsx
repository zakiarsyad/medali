import {
  type GradeNumbers,
  passingPercent,
} from "@/character-grades/grade-numbers";
import { LIMITED_WORDS, shownOneDecimal } from "@/character-grades/grade-words";
import type { GradeLetter } from "@/character-grades/scheme-ids";
import { NumberCard, NumberCards } from "@/ui/number-cards";

function shown(count: number): string {
  return count.toLocaleString("id-ID");
}

function shownShare(percent: number | null): string {
  if (percent === null) return "-";
  return `${shown(percent)}%`;
}

/** The numbers above "Skema bobot". */
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
      <NumberCard
        label={LIMITED_WORDS}
        amount={numbers.limited}
        note="karena hukuman disiplin"
      />
    </NumberCards>
  );
}
