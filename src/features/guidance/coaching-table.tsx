import { CoachingLevelBadge } from "@/character-scores/coaching-level-badge";
import { COACHING_STATUS_WORDS } from "@/character-scores/coaching-status";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { valueNameOf } from "@/ui/medali-values";
import { ProfileNameLink } from "@/ui/profile-name-link";
import { ValueSwatch } from "@/ui/value-swatch";
import { type CoachingParams, coachingAddress } from "./coaching-address";
import type { CoachingRow } from "./coaching-board";
import styles from "./coaching-list.module.css";

/** NIM, program studi and, while a period runs, the semester. */
function factsOf(row: CoachingRow): string {
  const facts = [row.nim, row.program];
  if (row.semester !== null) facts.push(`Smt ${row.semester}`);
  return facts.join(" · ");
}

/** The status of a row, with the note of what was done under it. */
function StatusCell({ row }: { row: CoachingRow }) {
  return (
    <>
      <span className={shared.badge}>{COACHING_STATUS_WORDS[row.status]}</span>
      {row.note !== "" && <small className={styles.note}>{row.note}</small>}
    </>
  );
}

function CoachingLine({
  row,
  params,
}: {
  row: CoachingRow;
  params: CoachingParams;
}) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <ProfileNameLink
          name={row.name}
          href={coachingAddress({ ...params, profileId: row.studentId })}
        />
        <small className={shared.detail}>{factsOf(row)}</small>
      </td>
      <td data-title="Pengasuh">{row.mentorName ?? "-"}</td>
      <td data-title="Tingkat">
        <CoachingLevelBadge level={row.level} />
      </td>
      <td data-title="Aspek terlemah">
        <span className={styles.weakest}>
          <ValueSwatch value={row.weakest} />
          {valueNameOf(row.weakest)}
          <span className={styles.weakScore}>{row.weakestScore}</span>
        </span>
      </td>
      <td className={styles.rerata} data-title="Rerata">
        {shownRerata(row.rerata)}
      </td>
      <td data-title="Status">
        <StatusCell row={row} />
      </td>
    </tr>
  );
}

/**
 * The students of one page. On a phone each is a card. A name opens the
 * student's profile over the tab, as the server decides to show it.
 */
export function CoachingTable({
  rows,
  params,
}: {
  rows: CoachingRow[];
  /** The choices of the list, kept when a profile opens over it. */
  params: CoachingParams;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Pengasuh</th>
            <th>Tingkat</th>
            <th>Aspek terlemah</th>
            <th>Rerata</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CoachingLine key={row.studentId} row={row} params={params} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
