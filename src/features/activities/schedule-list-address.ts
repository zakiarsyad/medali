import { STAGES } from "@/academic-periods/stages";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const SCHEDULES_ADDRESS = "/kegiatan/ppks";

export interface ScheduleListParams {
  /** The tahap chosen above the list, from 1 to 4. Null means every tahap. */
  level: number | null;
  /** The page of the list, counted from 1. */
  page: number;
}

const LEVEL = /^[1-9]$/;
const PAGE = /^[1-9]\d{0,5}$/;

function readLevel(sent: string): number | null {
  if (!LEVEL.test(sent)) return null;
  const level = Number(sent);
  return level <= STAGES.length ? level : null;
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readScheduleListParams(
  params: SearchParams,
): ScheduleListParams {
  const page = firstParam(params.hal);
  return {
    level: readLevel(firstParam(params.tahap)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of a page of the list for a tahap. What is not chosen is
 * left out, and so is the first page.
 */
export function scheduleListAddress(level: number | null, page = 1): string {
  const params = new URLSearchParams();
  if (level !== null) params.set("tahap", String(level));
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  return search === "" ? SCHEDULES_ADDRESS : `${SCHEDULES_ADDRESS}?${search}`;
}
