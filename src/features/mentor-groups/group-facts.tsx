import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { mentorLabel } from "@/ui/mentor-label";
import type { EvaluatedGroup, MentorOfToday } from "./evaluated-group";
import { EvaluationBadge } from "./evaluation-badge";
import styles from "./mentor-groups.module.css";

/** What a form says while no group is chosen. */
export function ChooseGroupFirst() {
  return (
    <p className={styles.quiet}>
      Pilih kelompok untuk melihat pengasuh saat ini dan indikator kinerjanya.
    </p>
  );
}

/**
 * The box above a form: who holds the group, since when, how large it is,
 * and "Evaluasi terakhir".
 */
export function MentorFacts({
  group,
  mentor,
}: {
  group: EvaluatedGroup;
  mentor: MentorOfToday;
}) {
  return (
    <p className={styles.facts}>
      <b>{mentorLabel(mentor)}</b> mengasuh {groupCode(group)} sejak{" "}
      {shownDay(mentor.since)}. {group.members.toLocaleString("id-ID")}{" "}
      mahasiswa aktif. Evaluasi terakhir:{" "}
      <EvaluationBadge average={group.last} />
    </p>
  );
}
