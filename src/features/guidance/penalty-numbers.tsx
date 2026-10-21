"use client";

import { createContext, type ReactNode, useState } from "react";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { PenaltyNumbers } from "./penalty-board";
import { CHARACTER_SCORE_CAP } from "./penalty-rules";

/**
 * Puts the "Kerja sosial belum selesai" a status change answers in the
 * numbers, so the list is not read again for it.
 */
export const SetUnfinishedWork = createContext<(count: number) => void>(
  () => undefined,
);

/** The four numbers of the tab, of the students the account sees. */
function PenaltyNumbersRow({ numbers }: { numbers: PenaltyNumbers }) {
  const capped = `nilai dibatasi ${CHARACTER_SCORE_CAP}`;
  return (
    <NumberCards>
      <NumberCard
        label="Pelanggaran ringan"
        amount={numbers.light}
        note={capped}
      />
      <NumberCard
        label="Pelanggaran sedang"
        amount={numbers.medium}
        note={capped}
      />
      <NumberCard
        label="Pelanggaran berat"
        amount={numbers.heavy}
        note="skorsing atau diberhentikan"
      />
      <NumberCard
        label="Kerja sosial belum selesai"
        amount={numbers.unfinishedWork}
        note="dijatuhkan atau sedang dijalani"
      />
    </NumberCards>
  );
}

/**
 * The numbers above what follows them on the tab, which may change
 * "Kerja sosial belum selesai". Numbers the page reads again take the
 * place of a count changed here.
 */
export function PenaltyNumbersAbove({
  numbers,
  children,
}: {
  numbers: PenaltyNumbers;
  children: ReactNode;
}) {
  const [read, setRead] = useState(numbers);
  const [unfinishedWork, setUnfinishedWork] = useState(numbers.unfinishedWork);
  if (read !== numbers) {
    setRead(numbers);
    setUnfinishedWork(numbers.unfinishedWork);
  }
  return (
    <SetUnfinishedWork value={setUnfinishedWork}>
      <PenaltyNumbersRow numbers={{ ...numbers, unfinishedWork }} />
      {children}
    </SetUnfinishedWork>
  );
}
