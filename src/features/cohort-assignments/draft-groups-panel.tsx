import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { mentorLabel } from "@/ui/mentor-label";
import { STATUS_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import { fixedWords } from "./fix-words";
import { GroupFactCells, GroupFactTitles } from "./group-fact-cells";
import type { DraftGroup, StoredAssignment } from "./stored-assignment";

function GroupRow({
  group,
  since,
}: {
  group: DraftGroup;
  /** The day the mentor took the group, for a fixed penetapan. */
  since: string | null;
}) {
  return (
    <tr>
      <GroupFactCells group={group} />
      <td data-title="Pengasuh">
        {group.mentor ? mentorLabel(group.mentor) : "-"}
        {since !== null && (
          <small className={shared.detail}>sejak {shownDay(since)}</small>
        )}
      </td>
    </tr>
  );
}

type Shown = Pick<
  StoredAssignment,
  | "cohortYear"
  | "status"
  | "groups"
  | "decreeNumber"
  | "effectiveOn"
  | "savedBy"
>;

/**
 * The groups of a penetapan as they are saved, to read only: the code,
 * the program studi, how many members each one holds and the mentor
 * chosen for it. A fixed one says so, with its decree number, the day its
 * groups started and who fixed it. No member is named here, and nothing
 * in the table can be changed.
 */
export function DraftGroupsPanel({
  assignment,
  action,
  children,
}: {
  assignment: Shown;
  /** A button beside the heading, for an account that may press it. */
  action?: ReactNode;
  /** What stands under the table, for an account that may see it. */
  children?: ReactNode;
}) {
  const { cohortYear, status, groups } = assignment;
  const isFixed = status === "fixed";
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            {isFixed
              ? `Angkatan ${cohortYear} sudah ditetapkan`
              : "Draf penetapan"}
          </h2>
          {isFixed && <p className={styles.sub}>{fixedWords(assignment)}</p>}
        </div>
        {action ?? (
          <span className={shared.badge}>{STATUS_TITLES[status]}</span>
        )}
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
              <GroupRow
                key={group.id}
                group={group}
                since={isFixed ? assignment.effectiveOn : null}
              />
            ))}
          </tbody>
        </table>
      </div>
      {children}
    </section>
  );
}
