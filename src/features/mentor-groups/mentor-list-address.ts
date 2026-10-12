import { MENTOR_STATUSES, type MentorStatus } from "@/ui/mentor-status";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const MENTOR_LIST_ADDRESS = "/pengasuh/daftar";

/** The filters above the list. Null means every choice. */
export interface MentorListFilters {
  /** Searched for in the name of the mentor. */
  query: string;
  status: MentorStatus | null;
  unit: string | null;
}

export interface MentorListParams {
  filters: MentorListFilters;
  /** The page of the list, counted from 1. */
  page: number;
  /**
   * What the address gives as the id of the mentor whose page is open
   * instead of the list, or null when it names none. It is not checked
   * here: the read of the mentor answers "not found" for what is no id.
   */
  mentorId: string | null;
  /** The same for the student whose detail is open over the mentor's page. */
  detailId: string | null;
}

export const NO_FILTERS: MentorListFilters = {
  query: "",
  status: null,
  unit: null,
};

/** Each status as the address writes it. */
export const STATUS_IN_ADDRESS: Record<MentorStatus, string> = {
  mentoring: "mengasuh",
  reserve: "cadangan",
  inactive: "tidak-aktif",
};

const SEARCH_MAX_LENGTH = 100;
const UNIT_MAX_LENGTH = 200;
const PAGE = /^[1-9]\d{0,5}$/;
/** As long as the id of a record is. */
const ID_LENGTH = 36;

function readId(value: SearchParams[string]): string | null {
  const id = firstParam(value).trim().slice(0, ID_LENGTH);
  return id === "" ? null : id;
}

function readStatus(value: SearchParams[string]): MentorStatus | null {
  const text = firstParam(value);
  return (
    MENTOR_STATUSES.find((status) => STATUS_IN_ADDRESS[status] === text) ?? null
  );
}

/** A unit is searched for as written: one no mentor has finds no mentor. */
function readUnit(value: SearchParams[string]): string | null {
  const unit = firstParam(value).trim().slice(0, UNIT_MAX_LENGTH);
  return unit === "" ? null : unit;
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readMentorListParams(params: SearchParams): MentorListParams {
  const page = firstParam(params.hal);
  return {
    page: PAGE.test(page) ? Number(page) : 1,
    mentorId: readId(params.pengasuh),
    detailId: readId(params.profil),
    filters: {
      query: firstParam(params.q).trim().slice(0, SEARCH_MAX_LENGTH),
      status: readStatus(params.status),
      unit: readUnit(params.unit),
    },
  };
}

/**
 * The address of a page of the list with these filters. What is not chosen
 * is left out, and so is the first page.
 */
export function mentorListAddress(
  filters: MentorListFilters,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status !== null) {
    params.set("status", STATUS_IN_ADDRESS[filters.status]);
  }
  if (filters.unit !== null) params.set("unit", filters.unit);
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  return search === ""
    ? MENTOR_LIST_ADDRESS
    : `${MENTOR_LIST_ADDRESS}?${search}`;
}

/** The address of the page of one mentor. */
export function mentorAddress(mentorId: string): string {
  const params = new URLSearchParams({ pengasuh: mentorId });
  return `${MENTOR_LIST_ADDRESS}?${params}`;
}

/** The address of a student's detail, open over the page of their mentor. */
export function mentorStudentAddress(
  mentorId: string,
  studentId: string,
): string {
  const params = new URLSearchParams({ pengasuh: mentorId, profil: studentId });
  return `${MENTOR_LIST_ADDRESS}?${params}`;
}
