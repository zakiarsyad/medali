import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import type { ListedGroup } from "./group-list";
import { groupAddress } from "./group-list-address";
import { historyWords } from "./mentor-history";

const BETWEEN = " · ";

/** The program studi, the angkatan, and the jalur when it is alih program. */
function programAndCohort(group: ListedGroup): string {
  const words = [group.studyProgram, `angkatan ${group.cohortYear}`];
  if (group.entryPath === "transfer") words.push("alih program");
  return words.join(BETWEEN);
}

function GroupRow({ group }: { group: ListedGroup }) {
  const address = groupAddress(group.id);
  return (
    <PressableRow address={address} opens="page">
      <td data-title="Kelompok">
        <Link href={address} className={pressable.open}>
          <b>{groupCode(group)}</b>
        </Link>
        <small className={shared.detail}>{programAndCohort(group)}</small>
      </td>
      <td data-title="Pengasuh">
        <b>{group.mentorName ?? "-"}</b>
        {group.mentorSince && (
          <small className={shared.detail}>
            sejak {shownDay(group.mentorSince)}
          </small>
        )}
      </td>
      <td data-title="Anggota">{group.members.toLocaleString("id-ID")}</td>
      <td data-title="Riwayat">{historyWords(group.mentorLines)}</td>
    </PressableRow>
  );
}

export function GroupListTable({ groups }: { groups: ListedGroup[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Kelompok</th>
            <th>Pengasuh</th>
            <th>Anggota</th>
            <th>Riwayat</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
