import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { GroupNumbers } from "./group-numbers";
import { averageSize, USUAL_SIZE_WORDS } from "./group-size";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

export function GroupNumbersView({ numbers }: { numbers: GroupNumbers }) {
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
    </NumberCards>
  );
}
