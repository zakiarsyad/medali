import { STAGES } from "@/academic-periods/stages";
import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const SCHEDULES_ADDRESS = "/kegiatan/ppks";

/** The schedule whose "Peserta" is open, and the page of its students. */
export interface OpenAbsent {
  scheduleId: string;
  /** The page of the students, counted from 1. */
  page: number;
}

export interface ScheduleListParams {
  /** The tahap chosen above the list, from 1 to 4. Null means every tahap. */
  level: number | null;
  /** The page of the list, counted from 1. */
  page: number;
  /** The "Peserta" that is open, or null while none is. */
  open: OpenAbsent | null;
}

const LEVEL = /^[1-9]$/;
const PAGE = /^[1-9]\d{0,5}$/;

function readLevel(sent: string): number | null {
  if (!LEVEL.test(sent)) return null;
  const level = Number(sent);
  return level <= STAGES.length ? level : null;
}

function readPage(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

function readOpen(params: SearchParams): OpenAbsent | null {
  const scheduleId = firstParam(params.peserta);
  if (!isUuid(scheduleId)) return null;
  return { scheduleId, page: readPage(firstParam(params.halPeserta)) };
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readScheduleListParams(
  params: SearchParams,
): ScheduleListParams {
  return {
    level: readLevel(firstParam(params.tahap)),
    page: readPage(firstParam(params.hal)),
    open: readOpen(params),
  };
}

/**
 * The address of a page of the list for a tahap, with the "Peserta" of
 * one schedule open when `open` names it. What is not chosen is left
 * out, and so is a first page.
 */
export function scheduleListAddress(
  level: number | null,
  page = 1,
  open: OpenAbsent | null = null,
): string {
  const params = new URLSearchParams();
  if (level !== null) params.set("tahap", String(level));
  if (page > 1) params.set("hal", String(page));
  if (open !== null) {
    params.set("peserta", open.scheduleId);
    if (open.page > 1) params.set("halPeserta", String(open.page));
  }
  const search = params.toString();
  return search === "" ? SCHEDULES_ADDRESS : `${SCHEDULES_ADDRESS}?${search}`;
}
