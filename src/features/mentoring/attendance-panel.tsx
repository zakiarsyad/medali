import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { suggestedTopic } from "@/mentoring/meeting-topics";
import shared from "@/ui/data-screen.module.css";
import { AttendanceForm } from "./attendance-form";
import { allMarked } from "./attendance-form-values";
import type { GroupMember } from "./group-meetings";
import { lastMeetingDay } from "./meeting-day";
import { LIST_ANCHOR, meetingsAddress } from "./meetings-address";

/**
 * "Daftar hadir pertemuan" of one meeting, under the cards: the form, for
 * an account that may fill in the lists of the group. It opens with the
 * last day a meeting can have been held on, which is today while the
 * period runs, the topic suggested for the meeting, and every member
 * marked Hadir.
 */
export function AttendancePanel({
  groupId,
  period,
  number,
  members,
}: {
  groupId: string;
  /** The running period. */
  period: AcademicPeriod;
  number: number;
  /** The Aktif members of the group, by name. */
  members: GroupMember[];
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
        start={{
          heldOn: lastDay,
          topic: suggestedTopic(number),
          marks: allMarked(memberIds, "present"),
        }}
        firstDay={period.startsOn}
        lastDay={lastDay}
        closeAddress={meetingsAddress(groupId)}
      />
    </section>
  );
}
