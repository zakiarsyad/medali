import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { MEDALI_VALUES } from "@/ui/medali-values";
import type { AssessmentListRow } from "./assessment-board";
import { rerataOf } from "./assessment-score";
import { NOT_ASSESSED, SOURCE_WORDS, shownRerata } from "./assessment-words";
import styles from "./character-assessment.module.css";
import type { LatestAssessment } from "./latest-assessments";
import { PredicateBadge } from "./predicate-badge";

export const NO_ASSESSMENT_MATCHES = "Tidak ada data pada filter ini.";

/** The columns after Mahasiswa: Tanggal, Sumber, the six values, Rerata and Predikat. */
const AFTER_STUDENT = 2 + MEDALI_VALUES.length + 2;

function LatestCells({ latest }: { latest: LatestAssessment }) {
  const rerata = rerataOf(latest.scores);
  return (
    <>
      <td data-title="Tanggal">{DAY.format(latest.enteredAt)}</td>
      <td data-title="Sumber">
        {SOURCE_WORDS[latest.source]}
        <small className={`${shared.detail} ${shared.typed}`}>
          {latest.enteredBy}
        </small>
      </td>
      {MEDALI_VALUES.map(({ key, name }) => (
        <td key={key} data-title={name}>
          {latest.scores[key]}
        </td>
      ))}
      <td className={styles.strong} data-title="Rerata">
        {shownRerata(rerata)}
      </td>
      <td data-title="Predikat">
        <PredicateBadge rerata={rerata} />
      </td>
    </>
  );
}

/**
 * "Hasil asesmen karakter": each student with their latest assessment,
 * or "Belum diasesmen". On a phone each student is a block of its own.
 */
export function AssessmentListTable({
  rows,
}: {
  rows: readonly AssessmentListRow[];
}) {
  if (rows.length === 0) {
    return <p className={shared.empty}>{NO_ASSESSMENT_MATCHES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Tanggal</th>
            <th>Sumber</th>
            {MEDALI_VALUES.map(({ key, name }) => (
              <th key={key}>
                <abbr title={name}>{key}</abbr>
              </th>
            ))}
            <th>Rerata</th>
            <th>Predikat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, name, nim, program, latest }) => (
            <tr key={id}>
              <td className={shared.rowHeading} data-title="Mahasiswa">
                <b className={shared.typed}>{name}</b>
                <small className={shared.detail}>
                  {nim} · {program}
                </small>
              </td>
              {latest ? (
                <LatestCells latest={latest} />
              ) : (
                <td colSpan={AFTER_STUDENT} data-title="Asesmen">
                  <span className={shared.badge}>{NOT_ASSESSED}</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
