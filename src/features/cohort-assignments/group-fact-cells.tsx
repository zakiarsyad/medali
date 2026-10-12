import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { isUsualSize, USUAL_SIZE_WORDS } from "@/ui/group-size";
import styles from "./cohort-assignments.module.css";
import { batchLabel } from "./intake-summary";
import { sexCounts } from "./sex-counts";
import type { DraftGroup } from "./stored-assignment";

/** The titles of the columns that `GroupFactCells` fills. */
export function GroupFactTitles() {
  return (
    <>
      <th>Kelompok</th>
      <th>Program studi</th>
      <th>Anggota</th>
    </>
  );
}

/**
 * The first cells of the row of a group: its code, its program studi and
 * how many members it holds, putra and putri. A size outside the usual
 * one is marked, as a warning only. No member is named here.
 */
export function GroupFactCells({ group }: { group: DraftGroup }) {
  const { male, female } = sexCounts(group.members);
  const size = group.members.length;
  return (
    <>
      <td data-title="Kelompok">
        <b>{groupCode(group)}</b>
      </td>
      <td data-title="Program studi">{batchLabel(group)}</td>
      <td data-title="Anggota">
        {size}
        <small className={shared.detail}>
          {male} putra, {female} putri
        </small>
        {!isUsualSize(size) && (
          <small className={styles.unusual}>
            di luar ukuran {USUAL_SIZE_WORDS}
          </small>
        )}
      </td>
    </>
  );
}
