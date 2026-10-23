import Link from "next/link";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { EvaluationBadge } from "./evaluation-badge";
import type { ListedGroup } from "./group-list";
import { groupAddress } from "./group-list-address";
import type { LastEvaluations } from "./last-evaluations";
import type { Reratas } from "./medali-averages";
import { historyWords, NO_MENTOR } from "./mentor-history";

const BETWEEN = " · ";

/** The program studi, the angkatan, and the jalur when it is alih program. */
export function programAndCohort(
  group: Pick<ListedGroup, "studyProgram" | "cohortYear" | "entryPath">,
): string {
  const words = [group.studyProgram, `angkatan ${group.cohortYear}`];
  if (group.entryPath === "transfer") words.push("alih program");
  return words.join(BETWEEN);
}

function GroupRow({
  group,
  lastEvaluations,
  rerata,
}: {
  group: ListedGroup;
  lastEvaluations: LastEvaluations | null;
  rerata: number | null;
}) {
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
        <b>{group.mentorName ?? NO_MENTOR}</b>
        {group.mentorSince && (
          <small className={shared.detail}>
            sejak {shownDay(group.mentorSince)}
          </small>
        )}
      </td>
      <td data-title="Anggota">{group.members.toLocaleString("id-ID")}</td>
      <td data-title="Rerata MEDALI">{shownRerata(rerata)}</td>
      {lastEvaluations !== null && (
        <td data-title="Evaluasi terakhir">
          <EvaluationBadge scores={lastEvaluations.get(group.id) ?? null} />
        </td>
      )}
      <td data-title="Riwayat">
        {historyWords(group.mentorLines, group.mentorName !== null)}
      </td>
    </PressableRow>
  );
}

export function GroupListTable({
  groups,
  lastEvaluations,
  reratas,
}: {
  groups: ListedGroup[];
  /**
   * "Evaluasi terakhir" of the groups shown, or null for an account that
   * may not see evaluations: it gets no such column.
   */
  lastEvaluations: LastEvaluations | null;
  /** "Rerata MEDALI" of the groups shown that have an assessed member. */
  reratas: Reratas;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Kelompok</th>
            <th>Pengasuh</th>
            <th>Anggota</th>
            <th>Rerata MEDALI</th>
            {lastEvaluations !== null && <th>Evaluasi terakhir</th>}
            <th>Riwayat</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              lastEvaluations={lastEvaluations}
              rerata={reratas.get(group.id) ?? null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
