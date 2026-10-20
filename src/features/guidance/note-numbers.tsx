import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { NoteBoard } from "./note-board";
import { semesterWords } from "./note-words";

/** The four numbers of the running semester, of the students the account sees. */
export function NoteNumbersRow({ board }: { board: NoteBoard }) {
  const { numbers } = board;
  return (
    <NumberCards>
      <NumberCard
        label="Catatan aktif"
        amount={numbers.active}
        note={`semester ${semesterWords(board.period)}`}
      />
      <NumberCard
        label="Pelanggaran pertama"
        amount={numbers.first}
        note="catatan"
      />
      <NumberCard
        label="Pelanggaran lanjutan"
        amount={numbers.further}
        note="catatan"
      />
      <NumberCard
        label="Mahasiswa berulang"
        amount={numbers.repeated}
        note="dua catatan atau lebih"
      />
    </NumberCards>
  );
}
