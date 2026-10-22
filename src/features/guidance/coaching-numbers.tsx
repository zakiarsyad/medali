import { COACHING_LEVEL_WORDS } from "@/character-scores/coaching-words";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { CoachingNumbers } from "./coaching-board";
import {
  INTENSIVE_NOTE,
  identifiedWords,
  LIGHT_NOTE,
  MODERATE_NOTE,
} from "./coaching-list-words";

/** The four numbers of Pembinaan karakter, of the students the account sees. */
export function CoachingNumbersRow({ numbers }: { numbers: CoachingNumbers }) {
  return (
    <NumberCards>
      <NumberCard
        label="Belum selesai"
        amount={numbers.open}
        note={identifiedWords(numbers.identified)}
      />
      <NumberCard
        label={COACHING_LEVEL_WORDS.intensive}
        amount={numbers.intensive}
        note={INTENSIVE_NOTE}
      />
      <NumberCard
        label={COACHING_LEVEL_WORDS.moderate}
        amount={numbers.moderate}
        note={MODERATE_NOTE}
      />
      <NumberCard
        label={COACHING_LEVEL_WORDS.light}
        amount={numbers.light}
        note={LIGHT_NOTE}
      />
    </NumberCards>
  );
}
