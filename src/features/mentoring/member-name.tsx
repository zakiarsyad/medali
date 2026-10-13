import shared from "@/ui/data-screen.module.css";
import type { GroupMember } from "./group-meetings";
import styles from "./mentoring.module.css";

/** A member as an attendance list names them: name, NIM and kelas akademik. */
export function MemberName({ member }: { member: GroupMember }) {
  return (
    <div className={styles.memberName}>
      <b className={styles.chosen}>{member.name}</b>
      <small className={shared.detail}>
        {member.nim} · Kelas akademik {member.className ?? "-"}
      </small>
    </div>
  );
}
