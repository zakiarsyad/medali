import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import styles from "./cohort-assignments.module.css";
import type { DraftKey } from "./draft-change-input";
import { moveTargets } from "./move-member";
import { MoveSelect } from "./move-select";
import type { DraftGroup, DraftMember } from "./stored-assignment";

const SEX_WORDS: Record<DraftMember["sex"], string> = {
  male: "putra",
  female: "putri",
};

/** What stands under the name of a member: what the three methods read. */
function memberFacts(member: DraftMember): string {
  const facts = [
    member.nim,
    SEX_WORDS[member.sex],
    member.province,
    member.className,
  ];
  return facts.filter((fact) => fact !== null).join(" · ");
}

/**
 * "Anggota": the members of one group of a draft by name, each with the
 * other groups of the same program studi and jalur to move to. Shown only
 * to an account that prepares the penetapan.
 */
export function GroupMembers({
  shown,
  group,
  groups,
}: {
  /** The draft the members are shown with. */
  shown: DraftKey;
  group: DraftGroup;
  /** Every group of the draft. */
  groups: DraftGroup[];
}) {
  const targets = moveTargets(groups, group.id).map((target) => ({
    id: target.id,
    code: groupCode(target),
  }));
  if (group.members.length === 0) {
    return <p className={shared.empty}>Kelompok ini belum punya anggota.</p>;
  }
  return (
    <ul className={styles.members}>
      {group.members.map((member) => (
        <li key={member.id} className={styles.member}>
          <div>
            <b>{member.name}</b>
            <small className={shared.detail}>{memberFacts(member)}</small>
          </div>
          {targets.length > 0 && (
            <MoveSelect
              shown={shown}
              studentId={member.id}
              studentName={member.name}
              targets={targets}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
