import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import { cohortYearOf, versionOf } from "./forming-input";
import { NOT_UNDERSTOOD } from "./refusals";

/** Which draft a change is for, as the form sends it. */
export interface SentDraftKey {
  cohortYear: string;
  version: string;
}

/** The draft a change is for, and the version it was shown with. */
export interface DraftKey {
  cohortYear: number;
  version: number;
}

export function parseDraftKey(sent: SentDraftKey): Parsed<DraftKey> {
  const cohortYear = cohortYearOf(sent.cohortYear);
  const version = versionOf(sent.version);
  if (cohortYear === null || version === null) return NOT_UNDERSTOOD;
  return { ok: true, value: { cohortYear, version } };
}

export interface SentMentorChoice extends SentDraftKey {
  groupId: string;
  /** Empty for "Pilih pengasuh…", which takes the mentor off the group. */
  mentorId: string;
}

export interface MentorChoiceInput extends DraftKey {
  groupId: string;
  /** Null to leave the group without a mentor. */
  mentorId: string | null;
}

export function parseMentorChoice(
  sent: SentMentorChoice,
): Parsed<MentorChoiceInput> {
  const key = parseDraftKey(sent);
  if (!key.ok) return key;
  const { groupId, mentorId } = sent;
  if (!isUuid(groupId)) return NOT_UNDERSTOOD;
  if (mentorId === "")
    return { ok: true, value: { ...key.value, groupId, mentorId: null } };
  if (!isUuid(mentorId)) return NOT_UNDERSTOOD;
  return { ok: true, value: { ...key.value, groupId, mentorId } };
}

export interface SentMove extends SentDraftKey {
  studentId: string;
  toGroupId: string;
}

export interface MoveInput extends DraftKey {
  studentId: string;
  toGroupId: string;
}

export function parseMove(sent: SentMove): Parsed<MoveInput> {
  const key = parseDraftKey(sent);
  if (!key.ok) return key;
  const { studentId, toGroupId } = sent;
  if (!isUuid(studentId) || !isUuid(toGroupId)) return NOT_UNDERSTOOD;
  return { ok: true, value: { ...key.value, studentId, toGroupId } };
}
