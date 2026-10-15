import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { daysBefore } from "@/academic-periods/days-before";
import type {
  activityAttendanceStatus,
  activityClarificationStatus,
  dormClarificationStatus,
  dormReturnReportStatus,
  dormViolationAppealStatus,
  sikuRequestStatus,
} from "@/db/schema";
import type { ProofKind } from "./proof-kinds";

type StatusOf<E extends { enumValues: readonly string[] }> =
  E["enumValues"][number];

type AttendanceStatus = StatusOf<typeof activityAttendanceStatus>;
type SikuRequestStatus = StatusOf<typeof sikuRequestStatus>;
type ReturnReportStatus = StatusOf<typeof dormReturnReportStatus>;
type ActivityClarificationStatus = StatusOf<typeof activityClarificationStatus>;
type DormClarificationStatus = StatusOf<typeof dormClarificationStatus>;
type AppealStatus = StatusOf<typeof dormViolationAppealStatus>;

const ATTENDANCE_DECIDED: AttendanceStatus[] = [
  "valid",
  "rejected",
  "dispensation",
];
const SIKU_REQUEST_DECIDED: SikuRequestStatus[] = [
  "approved",
  "rejected",
  "withdrawn",
];
const RETURN_REPORT_DECIDED: ReturnReportStatus[] = ["validated", "rejected"];
const ACTIVITY_CLARIFICATION_DECIDED: ActivityClarificationStatus[] = [
  "accepted",
  "rejected",
];
const DORM_CLARIFICATION_DECIDED: DormClarificationStatus[] = [
  "accepted",
  "rejected",
  "closed",
];
const APPEAL_DECIDED: AppealStatus[] = ["accepted", "rejected"];

/**
 * The statuses of each kind of record that no longer wait for anyone: a
 * decision was made, or the request was withdrawn or the clarification
 * closed. A file of a record in any other status is never removable.
 */
export const DECIDED_STATUSES: Record<ProofKind, readonly string[]> = {
  attendance_photo: ATTENDANCE_DECIDED,
  siku_photo: SIKU_REQUEST_DECIDED,
  return_photo: RETURN_REPORT_DECIDED,
  activity_clarification: ACTIVITY_CLARIFICATION_DECIDED,
  dorm_clarification: DORM_CLARIFICATION_DECIDED,
  appeal_proof: APPEAL_DECIDED,
};

/** A kept file as the rule sees it: what record it belongs to and when it was sent. */
export interface KeptProof {
  kind: ProofKind;
  status: string;
  /** The campus day the file was sent, or null when no day is known. */
  sentOn: string | null;
}

export interface KeepingRule {
  /** How many days a file is kept after its period ended; null while not set. */
  keepDays: number | null;
  periods: readonly Pick<AcademicPeriod, "startsOn" | "endsOn">[];
  today: string;
}

/** The period whose days hold a day, the first and last day included. */
function periodHolding(
  periods: KeepingRule["periods"],
  day: string,
): Pick<AcademicPeriod, "startsOn" | "endsOn"> | null {
  for (const period of periods) {
    if (period.startsOn <= day && day <= period.endsOn) return period;
  }
  return null;
}

/**
 * Whether a kept file may be removed now: its record has a final
 * decision, and the academic period it was sent in ended more than the
 * set number of days ago. Nothing is removable while the days are not
 * set, nor a file sent on a day no period holds.
 */
export function isRemovable(file: KeptProof, rule: KeepingRule): boolean {
  if (rule.keepDays === null) return false;
  if (!DECIDED_STATUSES[file.kind].includes(file.status)) return false;
  if (file.sentOn === null) return false;
  const period = periodHolding(rule.periods, file.sentOn);
  if (period === null) return false;
  return period.endsOn < daysBefore(rule.today, rule.keepDays);
}
