import shared from "@/ui/data-screen.module.css";
import { mentorLabel } from "@/ui/mentor-label";
import { STATUS_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import { GroupFactCells, GroupFactTitles } from "./group-fact-cells";
import type { DraftGroup, StoredAssignment } from "./stored-assignment";

function GroupRow({ group }: { group: DraftGroup }) {
  return (
    <tr>
      <GroupFactCells group={group} />
      <td data-title="Pengasuh">
        {group.mentor ? mentorLabel(group.mentor) : "-"}
      </td>
    </tr>
  );
}

/**
 * The groups of a penetapan as they are saved, to read only: the code,
 * the program studi, how many members each one holds and the mentor
 * chosen for it. No member is named here, and nothing can be changed.
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
              <GroupFactTitles />
              <th>Pengasuh</th>
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
