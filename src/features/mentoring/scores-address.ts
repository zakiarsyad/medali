import { firstParam, type SearchParams } from "@/ui/search-params";
import { askedGroupId, GROUP_PARAM, groupTabAddress } from "./group-address";

export const SCORES_ADDRESS = "/pengasuhan/nilai";

/** The part of the address that names the student whose detail is open. */
const DETAIL_PARAM = "profil";

/** As long as the id of a record is. */
const ID_LENGTH = 36;

export interface ScoresParams {
  /** The group asked for, or null when the address names none. */
  groupId: string | null;
  /**
   * What the address gives as the id of the student whose detail is open
   * over the tab, or null when it names none. It is not checked here: the
   * read of the detail answers "not found" for what is no id.
   */
  detailId: string | null;
}

/**
 * What the address asks the tab for. Nothing in an address is trusted:
 * what has not the shape of a row id names no group.
 */
export function readScoresParams(params: SearchParams): ScoresParams {
  const detailId = firstParam(params[DETAIL_PARAM]).trim().slice(0, ID_LENGTH);
  return {
    groupId: askedGroupId(params),
    detailId: detailId === "" ? null : detailId,
  };
}

/** The address of the tab showing one group, or its first group for none. */
export function scoresAddress(groupId: string | null): string {
  if (groupId === null) return SCORES_ADDRESS;
  return groupTabAddress(SCORES_ADDRESS, groupId);
}

/** The address of a student's detail, open over the scores of a group. */
export function scoreStudentAddress(
  groupId: string,
  studentId: string,
): string {
  const params = new URLSearchParams({
    [GROUP_PARAM]: groupId,
    [DETAIL_PARAM]: studentId,
  });
  return `${SCORES_ADDRESS}?${params}`;
}
