import { entryPath } from "@/db/schema";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const DASHBOARD_ADDRESS = "/dashboard";

export type EntryPath = (typeof entryPath.enumValues)[number];

/** The Instansi choice of the students who came from no instansi. */
export const NO_AGENCY = "tanpa";

/** The filters of the Dashboard. Null means every choice. */
export interface DashboardFilters {
  /** The number of a tahap, 1 to 4. */
  stageNo: number | null;
  studyProgramId: number | null;
  entryPath: EntryPath | null;
  province: string | null;
  /** The name of an instansi, or `NO_AGENCY`. */
  originAgency: string | null;
  affirmation: boolean | null;
  seedling: boolean | null;
  international: boolean | null;
}

export const NO_FILTERS: DashboardFilters = {
  stageNo: null,
  studyProgramId: null,
  entryPath: null,
  province: null,
  originAgency: null,
  affirmation: null,
  seedling: null,
  international: null,
};

/** How a yes or no choice is written in the address. */
export const YES = "ya";
export const NO = "tidak";

const STAGE_NO = /^[1-4]$/;
/** Short enough to fit the number the database keeps for a program studi. */
const PROGRAM_ID = /^[1-9]\d{0,8}$/;
/** Longer than any name of a provinsi or an instansi. */
const NAME_MAX_LENGTH = 200;

function readYesNo(text: string): boolean | null {
  if (text === YES) return true;
  if (text === NO) return false;
  return null;
}

function readName(text: string): string | null {
  const name = text.trim();
  if (name === "" || name.length > NAME_MAX_LENGTH) return null;
  return name;
}

/**
 * What the address asks the Dashboard for. Only the shape of each part is
 * checked here; whether a choice is known is checked against what the
 * account may choose, by `knownFilters`.
 */
export function readDashboardFilters(params: SearchParams): DashboardFilters {
  const stage = firstParam(params.tahap);
  const program = firstParam(params.prodi);
  const path = firstParam(params.jalur);
  return {
    stageNo: STAGE_NO.test(stage) ? Number(stage) : null,
    studyProgramId: PROGRAM_ID.test(program) ? Number(program) : null,
    entryPath: entryPath.enumValues.find((one) => one === path) ?? null,
    province: readName(firstParam(params.provinsi)),
    originAgency: readName(firstParam(params.instansi)),
    affirmation: readYesNo(firstParam(params.afirmasi)),
    seedling: readYesNo(firstParam(params.bibit)),
    international: readYesNo(firstParam(params.inter)),
  };
}

/** What the account may choose in the filter. */
export interface KnownChoices {
  /** False while no academic period runs: nobody is in a tahap then. */
  stages: boolean;
  /** The program studi it may choose: none for Ketua Program Studi. */
  programIds: ReadonlySet<number>;
  /** The provinsi and instansi its Aktif students hold. */
  provinces: ReadonlySet<string>;
  agencies: ReadonlySet<string>;
}

function knownOrNull<T>(value: T | null, known: ReadonlySet<T>): T | null {
  if (value === null) return null;
  return known.has(value) ? value : null;
}

/**
 * The filters with each choice the account may not make, or that names
 * nothing it knows, left out as if not chosen. Ketua Program Studi asking
 * for a program studi by hand gets every student they may see.
 */
export function knownFilters(
  filters: DashboardFilters,
  known: KnownChoices,
): DashboardFilters {
  return {
    ...filters,
    stageNo: known.stages ? filters.stageNo : null,
    studyProgramId: knownOrNull(filters.studyProgramId, known.programIds),
    province: knownOrNull(filters.province, known.provinces),
    originAgency: knownOrNull(filters.originAgency, known.agencies),
  };
}

/** How many filters are in use. */
export function filtersInUse(filters: DashboardFilters): number {
  return Object.values(filters).filter((choice) => choice !== null).length;
}

function yesNo(choice: boolean): string {
  return choice ? YES : NO;
}

function filterParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.stageNo !== null) params.set("tahap", String(filters.stageNo));
  if (filters.studyProgramId !== null) {
    params.set("prodi", String(filters.studyProgramId));
  }
  if (filters.entryPath !== null) params.set("jalur", filters.entryPath);
  if (filters.province !== null) params.set("provinsi", filters.province);
  if (filters.affirmation !== null) {
    params.set("afirmasi", yesNo(filters.affirmation));
  }
  if (filters.seedling !== null) params.set("bibit", yesNo(filters.seedling));
  if (filters.international !== null) {
    params.set("inter", yesNo(filters.international));
  }
  if (filters.originAgency !== null) {
    params.set("instansi", filters.originAgency);
  }
  return params;
}

function addressWith(params: URLSearchParams): string {
  const search = params.toString();
  return search === "" ? DASHBOARD_ADDRESS : `${DASHBOARD_ADDRESS}?${search}`;
}

/** The address of the Dashboard with these filters; what is not chosen is left out. */
export function dashboardAddress(filters: DashboardFilters): string {
  return addressWith(filterParams(filters));
}

/** The part of the address that names the student whose detail is open. */
export const DETAIL_PARAM = "profil";
/** As long as the id of a record is. */
const ID_LENGTH = 36;

/** The address of a student's detail, open over the Dashboard with these filters. */
export function studentDetailAddress(
  filters: DashboardFilters,
  studentId: string,
): string {
  const params = filterParams(filters);
  params.set(DETAIL_PARAM, studentId);
  return addressWith(params);
}

/**
 * What the address gives as the id of the student whose detail is open,
 * or null when it names none. It is not checked here: the read of the
 * detail answers "not found" for what is no id.
 */
export function readDashboardDetail(params: SearchParams): string | null {
  const id = firstParam(params[DETAIL_PARAM]).trim().slice(0, ID_LENGTH);
  return id === "" ? null : id;
}
