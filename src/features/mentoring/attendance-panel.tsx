import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { suggestedTopic } from "@/mentoring/meeting-topics";
import shared from "@/ui/data-screen.module.css";
import { AttendanceForm } from "./attendance-form";
import {
  type AttendanceValues,
  allMarked,
  marksToCorrect,
} from "./attendance-form-values";
import { NOT_SAVED_YET } from "./attendance-input";
import { withoutMark } from "./attendance-marks";
import type { GroupMember } from "./group-meetings";
import { lastMeetingDay } from "./meeting-day";
import { LIST_ANCHOR, meetingsAddress } from "./meetings-address";
import type { KeptList } from "./meetings-overview";

/**
 * What the form opens with. A meeting without a list opens with the last
 * day a meeting can have been held on, the topic suggested for it, and
 * every member marked Hadir. A meeting that has a list opens with it.
 */
function startValues(
  number: number,
  memberIds: string[],
  lastDay: string,
  kept: KeptList | null,
): AttendanceValues {
  if (kept === null) {
    return {
      heldOn: lastDay,
      topic: suggestedTopic(number),
      marks: allMarked(memberIds, "present"),
    };
  }
  return {
    heldOn: kept.meeting.heldOn,
    topic: kept.meeting.topic,
    marks: marksToCorrect(memberIds, kept.marks),
  };
}

/**
 * "Daftar hadir pertemuan" of one meeting, under the cards: the form, for
 * an account that may fill in the lists of the group.
 */
export function AttendancePanel({
  groupId,
  period,
  number,
  members,
  kept,
}: {
  groupId: string;
  /** The running period. */
  period: AcademicPeriod;
  number: number;
  /** The Aktif members of the group, by name. */
  members: GroupMember[];
  /** The list saved for the meeting, or null when it has none. */
  kept: KeptList | null;
}) {
  const lastDay = lastMeetingDay(period, campusDay());
  const memberIds = members.map((member) => member.id);
  return (
    <section id={LIST_ANCHOR} className={shared.panel}>
      {/* Made anew for each meeting, so its fields start from that meeting. */}
      <AttendanceForm
        key={`${groupId} ${number}`}
        groupId={groupId}
        number={number}
        members={members}
        unmarkedIds={kept === null ? [] : withoutMark(memberIds, kept.marks)}
        start={startValues(number, memberIds, lastDay, kept)}
        version={kept?.meeting.version ?? NOT_SAVED_YET}
        firstDay={period.startsOn}
        lastDay={lastDay}
        closeAddress={meetingsAddress(groupId)}
      />
    </section>
  );
}
