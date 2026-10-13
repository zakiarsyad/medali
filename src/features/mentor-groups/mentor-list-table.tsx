import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { INACTIVE_REASON, MENTOR_STATUS_TITLES } from "@/ui/mentor-status";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { EvaluationBadge } from "./evaluation-badge";
import type { LastEvaluations } from "./last-evaluations";
import { MentorGroupLinks } from "./mentor-group-links";
import type { ListedMentor } from "./mentor-list";
import { mentorAddress } from "./mentor-list-address";
import { titleAndUnit } from "./mentor-words";

/** What a row shows where a mentor has no group or no student. */
const NONE = "-";

function MentorRow({
  mentor,
  lastEvaluations,
}: {
  mentor: ListedMentor;
  lastEvaluations: LastEvaluations | null;
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
        {mentor.status === "inactive" && (
          <small className={shared.detail}>{INACTIVE_REASON}</small>
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
}: {
  mentors: ListedMentor[];
  /**
   * "Evaluasi terakhir" of the mentors shown, by the id of the mentor, or
   * null for an account that may not see evaluations: it gets no such
   * column.
   */
  lastEvaluations: LastEvaluations | null;
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
            {lastEvaluations !== null && <th>Evaluasi terakhir</th>}
          </tr>
        </thead>
        <tbody>
          {mentors.map((mentor) => (
            <MentorRow
              key={mentor.id}
              mentor={mentor}
              lastEvaluations={lastEvaluations}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
