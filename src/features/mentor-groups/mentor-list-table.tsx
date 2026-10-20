import Link from "next/link";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { MENTOR_STATUS_TITLES } from "@/ui/mentor-status";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { EvaluationBadge } from "./evaluation-badge";
import type { LastEvaluations } from "./last-evaluations";
import type { Reratas } from "./medali-averages";
import { MentorGroupLinks } from "./mentor-group-links";
import type { ListedMentor } from "./mentor-list";
import { mentorAddress } from "./mentor-list-address";
import { titleAndUnit } from "./mentor-words";

/** What a row shows where a mentor has no group or no student. */
const NONE = "-";

function MentorRow({
  mentor,
  lastEvaluations,
  rerata,
}: {
  mentor: ListedMentor;
  lastEvaluations: LastEvaluations | null;
  rerata: number | null;
}) {
  const address = mentorAddress(mentor.id);
  return (
    <PressableRow address={address} opens="page">
      <td data-title="Pengasuh">
        <Link href={address} className={pressable.open}>
          <b>{mentor.name}</b>
        </Link>
        <small className={shared.detail}>{titleAndUnit(mentor)}</small>
      </td>
      <td data-title="Status">
        <span className={shared.badge}>
          {MENTOR_STATUS_TITLES[mentor.status]}
        </span>
        {mentor.inactiveReason !== null && (
          <small className={shared.detail}>{mentor.inactiveReason}</small>
        )}
      </td>
      <td data-title="Kelompok">
        {mentor.groups.length === 0 ? (
          NONE
        ) : (
          <MentorGroupLinks groups={mentor.groups} />
        )}
      </td>
      <td data-title="Binaan">
        {mentor.students === 0 ? NONE : mentor.students.toLocaleString("id-ID")}
      </td>
      <td data-title="Rerata">{shownRerata(rerata)}</td>
      {lastEvaluations !== null && (
        <td data-title="Evaluasi terakhir">
          <EvaluationBadge scores={lastEvaluations.get(mentor.id) ?? null} />
        </td>
      )}
    </PressableRow>
  );
}

export function MentorListTable({
  mentors,
  lastEvaluations,
  reratas,
}: {
  mentors: ListedMentor[];
  /**
   * "Evaluasi terakhir" of the mentors shown, by the id of the mentor, or
   * null for an account that may not see evaluations: it gets no such
   * column.
   */
  lastEvaluations: LastEvaluations | null;
  /** "Rerata" of the mentors shown that have an assessed mentee. */
  reratas: Reratas;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Pengasuh</th>
            <th>Status</th>
            <th>Kelompok</th>
            <th>Binaan</th>
            <th>Rerata</th>
            {lastEvaluations !== null && <th>Evaluasi terakhir</th>}
          </tr>
        </thead>
        <tbody>
          {mentors.map((mentor) => (
            <MentorRow
              key={mentor.id}
              mentor={mentor}
              lastEvaluations={lastEvaluations}
              rerata={reratas.get(mentor.id) ?? null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
