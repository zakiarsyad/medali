import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { mentorLabel } from "@/ui/mentor-label";
import { STATUS_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import { fixedWords } from "./fix-words";
import { GroupFactCells, GroupFactTitles } from "./group-fact-cells";
import { GroupMembers } from "./group-members";
import { MembersLink } from "./members-link";
import type { DraftGroup, StoredAssignment } from "./stored-assignment";

/** The columns without "Anggota". */
const COLUMNS = 4;

function GroupRow({
  group,
  since,
  openGroupId,
}: {
  group: DraftGroup;
  /** The day the mentor took the group, for a fixed penetapan. */
  since: string | null;
  openGroupId: string | null | undefined;
}) {
  const namesMembers = openGroupId !== undefined;
  const isOpen = group.id === openGroupId;
  return (
    <>
      <tr>
        <GroupFactCells group={group} />
        <td data-title="Pengasuh">
          {group.mentor ? mentorLabel(group.mentor) : "-"}
          {since !== null && (
            <small className={shared.detail}>sejak {shownDay(since)}</small>
          )}
        </td>
        {namesMembers && (
          <td>
            <MembersLink
              cohortYear={group.cohortYear}
              groupId={group.id}
              isOpen={isOpen}
            />
          </td>
        )}
      </tr>
      {namesMembers && isOpen && (
        <tr>
          <td colSpan={COLUMNS + 1}>
            <GroupMembers group={group} />
          </td>
        </tr>
      )}
    </>
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
 * groups started and who fixed it. Nothing in the table can be changed.
 * No member is named unless `openGroupId` is given: then each group has
 * "Anggota", which lists its members to read only.
 */
export function DraftGroupsPanel({
  assignment,
  openGroupId,
  action,
  children,
}: {
  assignment: Shown;
  /**
   * The group whose members are shown, or null for none. Given only for
   * an account that may read the names of members; left out, the table
   * has no "Anggota".
   */
  openGroupId?: string | null | undefined;
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
              {openGroupId !== undefined && (
                <th>
                  <span className={shared.hidden}>Tindakan</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                since={isFixed ? assignment.effectiveOn : null}
                openGroupId={openGroupId}
              />
            ))}
          </tbody>
        </table>
      </div>
      {children}
    </section>
  );
}
