import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import {
  CONTINUATION_CONDITIONS,
  CONTINUATION_DECISIONS,
  type ContinuationCondition,
  type ContinuationDecision,
  type PenaltyCategory,
  type PenaltyLevel,
  type PenaltyStatus,
} from "./penalty-ids";
import {
  CONDITIONS_NOT_MET,
  NO_CONDITIONS,
  STATUS_IS_SET,
} from "./penalty-messages";

/*
 * The rules of following up a discipline penalty. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/** The statuses a follow-up chooses from; Ditetapkan is never one. */
export const FOLLOW_UP_STATUSES = ["imposed", "serving", "served"] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

/** What a follow-up changes of a penalty. */
export interface FollowUpValues {
  status: PenaltyStatus;
  conditionsMet: ContinuationCondition[];
  decision: ContinuationDecision;
}

/** The follow-up of a penalty as it is kept, with its version. */
export interface PenaltyFollowUp extends FollowUpValues {
  version: number;
}

/** What decides whether a penalty has Syarat melanjutkan studi. */
export interface ConditionsHolder {
  category: PenaltyCategory;
  level: PenaltyLevel;
  /** Whether the student has an Instansi asal now. */
  hasAgency: boolean;
}

/** A penalty as a follow-up finds it. */
export interface FollowedPenalty extends FollowUpValues, ConditionsHolder {}

/** What a follow-up tells the row it was made from. */
export interface FollowUpState extends FormState {
  /** The penalty as it is now; null when nothing was read. */
  followUp: PenaltyFollowUp | null;
  /** "Kerja sosial belum selesai" now; null when it did not change. */
  unfinishedWork: number | null;
}

export function isFollowUpStatus(sent: string): sent is FollowUpStatus {
  return (FOLLOW_UP_STATUSES as readonly string[]).includes(sent);
}

export function isContinuationCondition(
  sent: string,
): sent is ContinuationCondition {
  return (CONTINUATION_CONDITIONS as readonly string[]).includes(sent);
}

export function isContinuationDecision(
  sent: string,
): sent is ContinuationDecision {
  return (CONTINUATION_DECISIONS as readonly string[]).includes(sent);
}

/**
 * Syarat melanjutkan studi (ayat 7) belong to a suspension, Berat
 * jenjang pertama, of a student on study leave from an agency.
 */
export function hasConditions(penalty: ConditionsHolder): boolean {
  return (
    penalty.category === "heavy" && penalty.level === 1 && penalty.hasAgency
  );
}

export function allConditionsMet(met: ContinuationCondition[]): boolean {
  return CONTINUATION_CONDITIONS.every((condition) => met.includes(condition));
}

function valuesOf(penalty: FollowUpValues): FollowUpValues {
  const { status, conditionsMet, decision } = penalty;
  return { status, conditionsMet, decision };
}

/**
 * The follow-up with another status. A Ditetapkan penalty ends the
 * student's status for good, so it never changes. The status may go
 * back, such as from Selesai dijalani to Sedang dijalani: the log keeps
 * the trail.
 */
export function withStatus(
  before: FollowUpValues,
  status: FollowUpStatus,
): Parsed<FollowUpValues> {
  if (before.status === "set") return STATUS_IS_SET;
  return { ok: true, value: { ...valuesOf(before), status } };
}

/**
 * The follow-up with one condition ticked or not, the others as they
 * were, in their fixed order. Melanjutkan studi needs every tick, so
 * taking one away puts it back to Menunggu pemenuhan syarat.
 */
export function withCondition(
  before: FollowedPenalty,
  condition: ContinuationCondition,
  met: boolean,
): Parsed<FollowUpValues> {
  if (before.status === "set") return STATUS_IS_SET;
  if (!hasConditions(before)) return NO_CONDITIONS;
  const conditionsMet = CONTINUATION_CONDITIONS.filter((each) =>
    each === condition ? met : before.conditionsMet.includes(each),
  );
  const isContinueLost = before.decision === "continue" && !met;
  const decision = isContinueLost ? "pending" : before.decision;
  return {
    ok: true,
    value: { ...valuesOf(before), conditionsMet, decision },
  };
}

/** The follow-up with another Keputusan; Melanjutkan studi only once every condition is ticked. */
export function withDecision(
  before: FollowedPenalty,
  decision: ContinuationDecision,
): Parsed<FollowUpValues> {
  if (before.status === "set") return STATUS_IS_SET;
  if (!hasConditions(before)) return NO_CONDITIONS;
  if (decision === "continue" && !allConditionsMet(before.conditionsMet)) {
    return CONDITIONS_NOT_MET;
  }
  return { ok: true, value: { ...valuesOf(before), decision } };
}
