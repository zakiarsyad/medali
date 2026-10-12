import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { cohortAddress } from "./assignment-address";
import styles from "./cohort-assignments.module.css";
import type { DraftKey } from "./draft-change-input";
import { DraftCheckNote } from "./draft-check-note";
import { FillMentorsButton } from "./fill-mentors-button";
import { GroupFactCells, GroupFactTitles } from "./group-fact-cells";
import { GroupMembers } from "./group-members";
import {
  mentorOptions,
  type PoolMentor,
  SAME_JURUSAN_MARK,
} from "./mentor-options";
import { MentorSelect } from "./mentor-select";
import type { DraftGroup, StoredAssignment } from "./stored-assignment";

const COLUMNS = 5;

interface StepProps {
  /** The draft the step is shown with. */
  shown: DraftKey;
  groups: DraftGroup[];
  /** The mentors that may be chosen for the angkatan. */
  pool: PoolMentor[];
  /** The group whose members are shown, if any. */
  openGroupId: string | null;
}

function GroupRow({ group, ...step }: StepProps & { group: DraftGroup }) {
  const { shown, groups, pool, openGroupId } = step;
  const isOpen = group.id === openGroupId;
  const address = cohortAddress(shown.cohortYear, isOpen ? null : group.id);
  return (
    <>
      <tr>
        <GroupFactCells group={group} />
        <td data-title="Pengasuh">
          <MentorSelect
            shown={shown}
            groupId={group.id}
            groupCode={groupCode(group)}
            chosenId={group.mentor?.id ?? null}
            options={mentorOptions(pool, group.programName, group.mentor)}
          />
        </td>
        <td>
          <Link href={address} scroll={false} className={shared.link}>
            {isOpen ? "Tutup" : "Anggota"}
          </Link>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={COLUMNS}>
            <GroupMembers shown={shown} group={group} groups={groups} />
          </td>
        </tr>
      )}
    </>
  );
}

function chosenCount(groups: DraftGroup[]): number {
  return groups.filter((group) => group.mentor !== null).length;
}

/**
 * "3. Pengasuh setiap kelompok", for an account that prepares the
 * penetapan: the mentor of each group, "Isi otomatis yang kosong", and
 * "Anggota" to see the members of a group and move one. Every change is
 * saved as soon as it is made, so it stands inside `OneSaveAtATime`.
 */
export function MentorStepPanel({
  assignment,
  pool,
  openGroupId,
}: {
  assignment: Pick<StoredAssignment, "cohortYear" | "version" | "groups">;
  pool: PoolMentor[];
  openGroupId: string | null;
}) {
  const { cohortYear, version, groups } = assignment;
  const step = { shown: { cohortYear, version }, groups, pool, openGroupId };
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>3. Pengasuh setiap kelompok</h2>
          <p className={styles.sub}>
            {groups.length} kelompok · {chosenCount(groups)} sudah punya
            pengasuh
          </p>
        </div>
        <FillMentorsButton shown={step.shown} />
      </div>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <GroupFactTitles />
              <th>Pengasuh</th>
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRow key={group.id} group={group} {...step} />
            ))}
          </tbody>
        </table>
      </div>
      <DraftCheckNote groups={groups} />
      <p className={styles.hint}>
        Tanda {SAME_JURUSAN_MARK} berarti pengasuh dari jurusan yang sama dengan
        program studi kelompok. Setiap pilihan pengasuh dan perpindahan anggota
        langsung disimpan pada draf.
      </p>
    </section>
  );
}
