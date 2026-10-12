import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { STATUS_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import { batchLabel } from "./intake-summary";
import { sexCounts } from "./sex-counts";
import type { DraftGroup, StoredAssignment } from "./stored-assignment";

function GroupRow({ group }: { group: DraftGroup }) {
  const { male, female } = sexCounts(group.members);
  return (
    <tr>
      <td data-title="Kelompok">
        <b>{groupCode(group)}</b>
      </td>
      <td data-title="Program studi">{batchLabel(group)}</td>
      <td data-title="Anggota">
        {group.members.length}
        <small className={shared.detail}>
          {male} putra, {female} putri
        </small>
      </td>
    </tr>
  );
}

/**
 * The groups of a penetapan as they are saved: the code, the program
 * studi and how many members each one holds. No member is named here.
 */
export function DraftGroupsPanel({
  assignment,
}: {
  assignment: Pick<StoredAssignment, "cohortYear" | "status" | "groups">;
}) {
  const { cohortYear, status, groups } = assignment;
  const heading =
    status === "fixed"
      ? `Angkatan ${cohortYear} sudah ditetapkan`
      : "Draf penetapan";
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>{heading}</h2>
        <span className={shared.badge}>{STATUS_TITLES[status]}</span>
      </div>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Kelompok</th>
              <th>Program studi</th>
              <th>Anggota</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
