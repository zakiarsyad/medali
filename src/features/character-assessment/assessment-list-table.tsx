import Link from "next/link";
import { rerataOf } from "@/character-scores/assessment-score";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { NOT_ASSESSED } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { type AssessmentParams, assessmentAddress } from "./assessment-address";
import type { AssessmentListRow } from "./assessment-board";
import { shownSource } from "./assessment-words";
import styles from "./character-assessment.module.css";
import type { LatestAssessment } from "./latest-assessments";

export const NO_ASSESSMENT_MATCHES = "Tidak ada mahasiswa pada filter ini.";

/** The columns after Mahasiswa: Tanggal, Sumber, the six values, Rerata and Predikat. */
const AFTER_STUDENT = 2 + MEDALI_VALUES.length + 2;

function LatestCells({ latest }: { latest: LatestAssessment }) {
  const rerata = rerataOf(latest.scores);
  return (
    <>
      <td data-title="Tanggal">{DAY.format(latest.enteredAt)}</td>
      <td data-title="Sumber">
        <span className={shared.typed}>
          {shownSource(latest.source, latest.fileName)}
        </span>
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

function StudentCell({
  row,
  historyAddress,
}: {
  row: AssessmentListRow;
  historyAddress: string | null;
}) {
  const name = <b className={shared.typed}>{row.name}</b>;
  return (
    <td className={shared.rowHeading} data-title="Mahasiswa">
      {historyAddress === null ? (
        name
      ) : (
        <Link href={historyAddress} scroll={false} className={pressable.open}>
          {name}
        </Link>
      )}
      <small className={shared.detail}>
        {row.nim} · {row.program}
      </small>
    </td>
  );
}

function StudentRow({
  row,
  params,
}: {
  row: AssessmentListRow;
  params: AssessmentParams;
}) {
  if (row.latest === null) {
    return (
      <tr>
        <StudentCell row={row} historyAddress={null} />
        <td colSpan={AFTER_STUDENT} data-title="Asesmen">
          <span className={shared.badge}>{NOT_ASSESSED}</span>
        </td>
      </tr>
    );
  }
  const historyAddress = assessmentAddress({ ...params, historyId: row.id });
  return (
    <PressableRow address={historyAddress}>
      <StudentCell row={row} historyAddress={historyAddress} />
      <LatestCells latest={row.latest} />
    </PressableRow>
  );
}

/**
 * "Hasil asesmen karakter": each student with their latest assessment,
 * or "Belum diasesmen". Pressing a student with one opens their earlier
 * assessments. On a phone each student is a block of its own.
 */
export function AssessmentListTable({
  rows,
  params,
}: {
  rows: readonly AssessmentListRow[];
  params: AssessmentParams;
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
          {rows.map((row) => (
            <StudentRow key={row.id} row={row} params={params} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
