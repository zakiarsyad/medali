import { parseAccountEmail } from "@/auth/account-email";
import { entryPath, sex, studentStatus } from "@/db/schema";
import type { StudyProgram } from "@/db/study-programs";
import type { Parsed } from "@/parsed";
import { ORIGIN_AGENCIES, PROVINCES } from "./fixed-lists";
import {
  CLASS_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  isNim,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NIM_LENGTH,
} from "./input-limits";
import { CATEGORIES, type CategoryField } from "./labels";

/** A student form as the browser sends it: nothing in it is trusted. */
export interface StudentFields {
  nim: string;
  name: string;
  email: string;
  studyProgramId: string;
  entryPath: string;
  sex: string;
  cohortYear: string;
  className: string;
  province: string;
  originAgency: string;
  status: string;
  categories: string[];
}

export interface StudentInput extends Record<CategoryField, boolean> {
  nim: string;
  name: string;
  /**
   * The campus address of the student's account, in small letters, or
   * null when they have none. It is kept on the account, not the record.
   */
  email: string | null;
  studyProgramId: number;
  entryPath: (typeof entryPath.enumValues)[number];
  sex: (typeof sex.enumValues)[number];
  cohortYear: number;
  className: string | null;
  province: string | null;
  originAgency: string | null;
  status: (typeof studentStatus.enumValues)[number];
}

export interface InputContext {
  programs: StudyProgram[];
  /** The years that may be chosen as Angkatan. */
  cohortYears: number[];
  /**
   * The campus address ending from the settings, starting with "@". While
   * it is empty any well-formed address is taken.
   */
  campusEnding: string;
}

const COHORT_YEARS_BACK = 5;
const MALFORMED_EMAIL = "Alamat email tidak valid.";

/**
 * The refusals that a student file words in its own way, because a file
 * holds text where the form holds a choice.
 */
export const UNKNOWN_PROGRAM = "Program studi tidak dikenal.";
export const UNKNOWN_SEX = "Jenis kelamin harus Laki-laki atau Perempuan.";
export const UNKNOWN_PROVINCE = "Provinsi tidak dikenal.";
export const UNKNOWN_AGENCY = "Instansi asal tidak dikenal.";

export function invalidCohort(cohortYears: number[]): string {
  return `Angkatan tidak valid (contoh ${cohortYears[0]}).`;
}

/**
 * The Angkatan choices: this year and the five before, the newest first.
 * `keptYear` is the year a student already has, which stays a choice.
 */
export function cohortChoices(thisYear: number, keptYear?: number): number[] {
  const years: number[] = [];
  for (let back = 0; back <= COHORT_YEARS_BACK; back++) {
    years.push(thisYear - back);
  }
  if (keptYear !== undefined && !years.includes(keptYear)) {
    years.push(keptYear);
  }
  return years.sort((a, b) => b - a);
}

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function oneOf<T extends string>(
  choices: readonly T[],
  text: string,
): T | null {
  return choices.find((choice) => choice === text) ?? null;
}

function parseName(text: string): Parsed<string> {
  const name = text.trim().replace(/\s+/g, " ");
  if (name.length < NAME_MIN_LENGTH) return refused("Nama wajib diisi.");
  if (name.length > NAME_MAX_LENGTH) {
    return refused(`Nama paling banyak ${NAME_MAX_LENGTH} karakter.`);
  }
  return { ok: true, value: name };
}

/** The address is optional: empty means the student has none. */
function parseEmail(text: string, campusEnding: string): Parsed<string | null> {
  if (text.trim() === "") return { ok: true, value: null };
  if (text.trim().length > EMAIL_MAX_LENGTH) return refused(MALFORMED_EMAIL);
  return parseAccountEmail(text, campusEnding, MALFORMED_EMAIL);
}

function parseClassName(text: string): Parsed<string | null> {
  const className = text.trim();
  if (className.length > CLASS_MAX_LENGTH) {
    return refused(
      `Kelas akademik paling banyak ${CLASS_MAX_LENGTH} karakter.`,
    );
  }
  return { ok: true, value: className === "" ? null : className };
}

/** An optional choice from a fixed list. Empty means it is not known. */
function parseListed(
  list: readonly string[],
  text: string,
  error: string,
): Parsed<string | null> {
  if (text === "") return { ok: true, value: null };
  if (!list.includes(text)) return refused(error);
  return { ok: true, value: text };
}

function parseCategories(
  chosen: string[],
): Parsed<Record<CategoryField, boolean>> {
  const fields: string[] = CATEGORIES.map((category) => category.field);
  if (!chosen.every((field) => fields.includes(field))) {
    return refused("Kategori tidak dikenal.");
  }
  return {
    ok: true,
    value: {
      isAffirmation: chosen.includes("isAffirmation"),
      isSeedling: chosen.includes("isSeedling"),
      isInternational: chosen.includes("isInternational"),
      isBlended: chosen.includes("isBlended"),
    },
  };
}

type Choices = Pick<
  StudentInput,
  "studyProgramId" | "entryPath" | "sex" | "cohortYear" | "status"
>;

/** The fields that must be one of the choices the form offers. */
function parseChoices(
  fields: StudentFields,
  context: InputContext,
): Parsed<Choices> {
  const program = context.programs.find(
    (candidate) => String(candidate.id) === fields.studyProgramId,
  );
  if (!program) return refused(UNKNOWN_PROGRAM);
  const path = oneOf(entryPath.enumValues, fields.entryPath);
  if (!path) return refused("Jalur harus Reguler atau Alih program.");
  const studentSex = oneOf(sex.enumValues, fields.sex);
  if (!studentSex) return refused(UNKNOWN_SEX);
  const cohortYear = context.cohortYears.find(
    (year) => String(year) === fields.cohortYear,
  );
  if (cohortYear === undefined) {
    return refused(invalidCohort(context.cohortYears));
  }
  const status = oneOf(studentStatus.enumValues, fields.status);
  if (!status) return refused("Status harus Aktif, Cuti, atau Non Aktif.");
  return {
    ok: true,
    value: {
      studyProgramId: program.id,
      entryPath: path,
      sex: studentSex,
      cohortYear,
      status,
    },
  };
}

export function parseStudent(
  fields: StudentFields,
  context: InputContext,
): Parsed<StudentInput> {
  if (!isNim(fields.nim)) {
    return refused(`NIM harus ${NIM_LENGTH} digit angka.`);
  }
  const name = parseName(fields.name);
  if (!name.ok) return name;
  const email = parseEmail(fields.email, context.campusEnding);
  if (!email.ok) return email;
  const choices = parseChoices(fields, context);
  if (!choices.ok) return choices;
  const className = parseClassName(fields.className);
  if (!className.ok) return className;
  const province = parseListed(PROVINCES, fields.province, UNKNOWN_PROVINCE);
  if (!province.ok) return province;
  const agency = parseListed(
    ORIGIN_AGENCIES,
    fields.originAgency,
    UNKNOWN_AGENCY,
  );
  if (!agency.ok) return agency;
  const categories = parseCategories(fields.categories);
  if (!categories.ok) return categories;

  const isTransfer = choices.value.entryPath === "transfer";
  return {
    ok: true,
    value: {
      nim: fields.nim,
      name: name.value,
      email: email.value,
      ...choices.value,
      className: className.value,
      province: province.value,
      originAgency: isTransfer ? agency.value : null,
      ...categories.value,
    },
  };
}
