import { isUuid } from "@/db/is-uuid";
import { isMeetingNumber } from "@/mentoring/meeting-ids";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const MEETINGS_ADDRESS = "/pengasuhan/hadir";

/** The part of the address that names the group shown. */
export const GROUP_PARAM = "kelompok";

/** The part of the address that names the meeting whose list is open. */
export const MEETING_PARAM = "pertemuan";

/** Where on the page the attendance list is, for a link that opens it. */
export const LIST_ANCHOR = "daftar-hadir";

export interface MeetingsParams {
  /** The group asked for, or null when the address names none. */
  groupId: string | null;
  /** The meeting whose attendance list is open, or null for none. */
  number: number | null;
}

const NUMBER = /^[1-9]$/;

function numberAt(value: string): number | null {
  if (!NUMBER.test(value)) return null;
  const number = Number(value);
  return isMeetingNumber(number) ? number : null;
}

/**
 * What the address asks the tab for. Nothing in an address is trusted:
 * what has not the shape of a row id names no group, and what is no
 * number of a meeting opens no list.
 */
export function readMeetingsParams(params: SearchParams): MeetingsParams {
  const groupId = firstParam(params[GROUP_PARAM]).trim();
  return {
    groupId: isUuid(groupId) ? groupId : null,
    number: numberAt(firstParam(params[MEETING_PARAM]).trim()),
  };
}

/** The address of the tab showing one group, with no list open. */
export function meetingsAddress(groupId: string): string {
  const params = new URLSearchParams({ [GROUP_PARAM]: groupId });
  return `${MEETINGS_ADDRESS}?${params}`;
}

/** The address of the attendance list of one meeting of a group. */
export function attendanceListAddress(groupId: string, number: number): string {
  const params = new URLSearchParams({
    [GROUP_PARAM]: groupId,
    [MEETING_PARAM]: String(number),
  });
  return `${MEETINGS_ADDRESS}?${params}#${LIST_ANCHOR}`;
}
