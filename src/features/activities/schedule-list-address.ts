import { STAGES } from "@/academic-periods/stages";
import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";

/** The tab of the schedules of PPKS activities, or of the extra ones. */
export type ScheduleKind = "ppks" | "extra";

export const SCHEDULES_ADDRESS = "/kegiatan/ppks";
export const EXTRA_SCHEDULES_ADDRESS = "/kegiatan/tambahan";

const ADDRESSES: Record<ScheduleKind, string> = {
  ppks: SCHEDULES_ADDRESS,
  extra: EXTRA_SCHEDULES_ADDRESS,
};

/**
 * Which schedules a list shows: those of the PPKS activities of one tahap,
 * or of every tahap when `level` is null, or those of the special and
 * additional activities, which belong to no tahap.
 */
export type ScheduleScope =
  | { kind: "ppks"; level: number | null }
  | { kind: "extra" };

/** The schedule whose "Peserta" is open, and the page of its students. */
export interface OpenAbsent {
  scheduleId: string;
  /** The page of the students, counted from 1. */
  page: number;
}

export interface ScheduleListParams {
  scope: ScheduleScope;
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

function readScope(params: SearchParams, kind: ScheduleKind): ScheduleScope {
  if (kind === "extra") return { kind };
  return { kind, level: readLevel(firstParam(params.tahap)) };
}

/**
 * What the address of a tab asks its list for. Nothing in an address is
 * trusted: a part that is not understood counts as not chosen, and the
 * tab of the extra activities has no tahap to choose.
 */
export function readScheduleListParams(
  params: SearchParams,
  kind: ScheduleKind,
): ScheduleListParams {
  return {
    scope: readScope(params, kind),
    page: readPage(firstParam(params.hal)),
    open: readOpen(params),
  };
}

/**
 * The address of a page of the list of a scope, with the "Peserta" of
 * one schedule open when `open` names it. What is not chosen is left
 * out, and so is a first page.
 */
export function scheduleListAddress(
  scope: ScheduleScope,
  page = 1,
  open: OpenAbsent | null = null,
): string {
  const params = new URLSearchParams();
  if (scope.kind === "ppks" && scope.level !== null) {
    params.set("tahap", String(scope.level));
  }
  if (page > 1) params.set("hal", String(page));
  if (open !== null) {
    params.set("peserta", open.scheduleId);
    if (open.page > 1) params.set("halPeserta", String(open.page));
  }
  const search = params.toString();
  const address = ADDRESSES[scope.kind];
  return search === "" ? address : `${address}?${search}`;
}
