import Link from "next/link";
import { rerataOf, type Scores } from "@/character-scores/assessment-score";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { NOT_ASSESSED } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { ColouredScore } from "./coloured-score";
import styles from "./dashboard.module.css";
import { menteeDetailAddress } from "./dashboard-kind";
import type { MenteeMember } from "./mentee-recap";
import { NO_MENTEES } from "./mentee-words";

/** The six values, Rerata and Predikat. */
const SCORE_COLUMNS = MEDALI_VALUES.length + 2;

function ScoreCells({ scores }: { scores: Scores | null }) {
  if (scores === null) {
    return (
      <td colSpan={SCORE_COLUMNS} data-title="Asesmen">
        <span className={shared.badge}>{NOT_ASSESSED}</span>
      </td>
    );
  }
  const rerata = rerataOf(scores);
  return (
    <>
      {MEDALI_VALUES.map(({ key, name }) => (
        <td key={key} className={styles.valueCell} data-title={name}>
          <ColouredScore score={scores[key]} words={String(scores[key])} />
        </td>
      ))}
      <td data-title="Rerata">
        <b>{shownRerata(rerata)}</b>
      </td>
      <td data-title="Predikat">
        <PredicateBadge rerata={rerata} />
      </td>
    </>
  );
}

/** The name, as a link to the student's detail where it may be opened. */
function MemberName({
  member,
  address,
}: {
  member: MenteeMember;
  address: string | null;
}) {
  if (address === null) return <b>{member.name}</b>;
  return (
    <Link href={address} scroll={false} className={pressable.open}>
      <b>{member.name}</b>
    </Link>
  );
}

function MemberRow({ member }: { member: MenteeMember }) {
  const address = member.opensDetail
    ? menteeDetailAddress(member.studentId)
    : null;
  const cells = (
    <>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <MemberName member={member} address={address} />
        <small className={shared.detail}>{member.nim}</small>
      </td>
      <td data-title="Kelas akademik">{member.className ?? "-"}</td>
      <td data-title="Semester">{member.semester ?? "-"}</td>
      <ScoreCells scores={member.scores} />
    </>
  );
  if (address === null) return <tr>{cells}</tr>;
  return <PressableRow address={address}>{cells}</PressableRow>;
}

/**
 * The table of "Anak asuh": each anak asuh as the server sent them, the
 * lowest Rerata first and those not assessed last, each nilai with the
 * dot of its predikat. Pressing a row or a name opens the student's
 * detail over the Dashboard. On a phone each anak asuh is a block with
 * the six nilai in two rows.
 */
export function MenteeTable({ members }: { members: readonly MenteeMember[] }) {
  if (members.length === 0) {
    return <p className={shared.empty}>{NO_MENTEES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table
        className={`${shared.table} ${shared.stacked} ${styles.menteeTable}`}
      >
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kelas akademik</th>
            <th>Semester</th>
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
          {members.map((member) => (
            <MemberRow key={member.studentId} member={member} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
