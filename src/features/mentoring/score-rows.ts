import { DAY } from "@/ui/day";
import { attendanceCount, shownAttendance } from "./attendance-average";
import type { ScoredMember } from "./group-scores";
import type { StoredMark } from "./meetings-overview";
import { scoreStudentAddress } from "./scores-address";

/** One row of "Nilai anak asuh", as the screen shows it. */
export interface ScoreRow {
  id: string;
  name: string;
  nim: string;
  /** The address that opens the member's detail, or null for no link. */
  detailAddress: string | null;
  /** "Kehadiran pengasuhan", such as 3/4, or a dash for none yet. */
  attendance: string;
  /** The saved score, or null for a member without one. */
  score: number | null;
  /** The day the score was saved last as the screens show it, or null. */
  scoredOn: string | null;
}

/**
 * The rows of "Nilai anak asuh" of one group: each member with how many
 * of the saved meetings they came to and the score kept for them. `marks`
 * are those of the saved meetings of the group in the running period.
 */
export function scoreRowsOf(
  groupId: string,
  members: readonly ScoredMember[],
  marks: readonly StoredMark[],
): ScoreRow[] {
  return members.map((member) => {
    const own = marks.filter((mark) => mark.studentId === member.id);
    const count = attendanceCount(own.map((mark) => mark.mark));
    return {
      id: member.id,
      name: member.name,
      nim: member.nim,
      detailAddress: member.opensDetail
        ? scoreStudentAddress(groupId, member.id)
        : null,
      attendance: shownAttendance(count),
      score: member.score,
      scoredOn: member.scoredAt === null ? null : DAY.format(member.scoredAt),
    };
  });
}
