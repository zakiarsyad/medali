import styles from "./dashboard.module.css";
import { menteeDetailAddress } from "./dashboard-kind";
import { LatestNotesPanel } from "./latest-notes-panel";
import { attendanceWords, type MenteeNoteNumbers } from "./mentee-notes";
import type { LatestNote } from "./mentoring-recap";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The four numbers under the notes, two by two. */
function NoteNumbers({ numbers }: { numbers: MenteeNoteNumbers }) {
  const facts: [string, string][] = [
    ["Catatan 30 hari", shown(numbers.recentNotes)],
    ["Perlu pembinaan", shown(numbers.openCoaching)],
    ["Pelanggaran disiplin", shown(numbers.penalties)],
    ["Rerata kehadiran kegiatan", attendanceWords(numbers.attendance)],
  ];
  return (
    <dl className={styles.facts}>
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * "Catatan pengasuhan terbaru" of Dashboard anak asuh: the latest notes
 * about the anak asuh, "Tulis catatan" to Pengasuhan for an account that
 * may open it, and the four numbers under them.
 */
export function MenteeNotesPanel({
  notes,
  numbers,
  writeAddress,
}: {
  notes: LatestNote[];
  numbers: MenteeNoteNumbers;
  writeAddress: string | null;
}) {
  return (
    <LatestNotesPanel
      notes={notes}
      detailAddressOf={menteeDetailAddress}
      link={
        writeAddress === null
          ? null
          : { address: writeAddress, words: "Tulis catatan" }
      }
    >
      <NoteNumbers numbers={numbers} />
    </LatestNotesPanel>
  );
}
