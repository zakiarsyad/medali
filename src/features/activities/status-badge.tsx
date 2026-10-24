import { ToneBadge } from "@/ui/tone-badge";
import { SCHEDULE_LOOKS } from "./badge-look";
import { type ScheduleStatus, STATUS_WORDS } from "./schedule-status";

/** The status of a schedule, in the look of how far it is. */
export function StatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <ToneBadge tone={SCHEDULE_LOOKS[status]}>{STATUS_WORDS[status]}</ToneBadge>
  );
}
