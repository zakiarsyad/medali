import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { MentorGroupLinks } from "./mentor-group-links";
import type { ListedMentor } from "./mentor-list";
import { mentorAddress } from "./mentor-list-address";
import { INACTIVE_REASON, MENTOR_STATUS_TITLES } from "./mentor-status";
import { titleAndUnit } from "./mentor-words";

/** What a row shows where a mentor has no group or no student. */
const NONE = "-";

function MentorRow({ mentor }: { mentor: ListedMentor }) {
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
    </PressableRow>
  );
}

export function MentorListTable({ mentors }: { mentors: ListedMentor[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Pengasuh</th>
            <th>Status</th>
            <th>Kelompok</th>
            <th>Binaan</th>
          </tr>
        </thead>
        <tbody>
          {mentors.map((mentor) => (
            <MentorRow key={mentor.id} mentor={mentor} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
