import { averageSize, USUAL_SIZE_WORDS } from "@/ui/group-size";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { GroupNumbers } from "./group-numbers";
import type { ReplacementNumbers } from "./replacement-numbers";
import { spareWords } from "./replacement-words";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

export function GroupNumbersView({
  numbers,
  poorGroups,
  replacements,
}: {
  numbers: GroupNumbers;
  /**
   * How many groups have Kurang as their last evaluation, or null for an
   * account that may not see evaluations: it gets no such number.
   */
  poorGroups: number | null;
  /**
   * "Penggantian tahun ini", or null for an account that may not see
   * replacements: it gets no such number.
   */
  replacements: ReplacementNumbers | null;
}) {
  const { groups, members, usualSize } = numbers;
  return (
    <NumberCards>
      <NumberCard
        label="Kelompok pengasuhan"
        amount={groups}
        note={`${shown(members)} mahasiswa aktif`}
      />
      <NumberCard
        label="Ukuran kelompok"
        amount={averageSize(members, groups)}
        note={`rata-rata; ${shown(usualSize)} dari ${shown(groups)} kelompok berisi ${USUAL_SIZE_WORDS}`}
      />
      {poorGroups !== null && (
        <NumberCard
          label="Evaluasi kurang"
          amount={poorGroups}
          note="kelompok, pertimbangkan penggantian"
        />
      )}
      {replacements !== null && (
        <NumberCard
          label="Penggantian tahun ini"
          amount={replacements.thisYear}
          note={spareWords(replacements.spares)}
        />
      )}
    </NumberCards>
  );
}
