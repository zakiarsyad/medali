import { firstParam, type SearchParams } from "@/ui/search-params";
import { NAME_MAX_LENGTH } from "./input-limits";
import { addressOf } from "./new-students-address";

export const STUDENT_LIST_ADDRESS = "/mahasiswa";

/** Aktif dan cuti, Semua status, or Non aktif. */
export type StatusChoice = "current" | "all" | "inactive";

export interface StudentListFilters {
  query: string;
  cohortYear: number | null;
  status: StatusChoice;
}

export interface StudentListParams {
  filters: StudentListFilters;
}

/** How the list opens: Aktif dan cuti, and nothing else chosen. */
export const NO_FILTERS: StudentListFilters = {
  query: "",
  cohortYear: null,
  status: "current",
};

/** Each status choice as the address writes it. */
export const STATUS_IN_ADDRESS: Record<StatusChoice, string> = {
  current: "aktif",
  all: "semua",
  inactive: "nonaktif",
};

const YEAR = /^\d{4}$/;

function readStatus(text: string): StatusChoice {
  if (text === STATUS_IN_ADDRESS.all) return "all";
  if (text === STATUS_IN_ADDRESS.inactive) return "inactive";
  return NO_FILTERS.status;
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readStudentListParams(params: SearchParams): StudentListParams {
  const year = firstParam(params.angkatan);
  return {
    filters: {
      query: firstParam(params.q).trim().slice(0, NAME_MAX_LENGTH),
      cohortYear: YEAR.test(year) ? Number(year) : null,
      status: readStatus(firstParam(params.status)),
    },
  };
}

/** The address of the list with these filters. What is not chosen is left out. */
export function studentListAddress(filters: StudentListFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.cohortYear !== null) {
    params.set("angkatan", String(filters.cohortYear));
  }
  if (filters.status !== NO_FILTERS.status) {
    params.set("status", STATUS_IN_ADDRESS[filters.status]);
  }
  return addressOf(STUDENT_LIST_ADDRESS, params.toString());
}
