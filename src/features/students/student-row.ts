import type { StudyProgram } from "@/db/study-programs";
import { ORIGIN_AGENCIES, PROVINCES } from "./fixed-lists";
import type { CategoryField } from "./labels";
import type { FileCells, FileColumn } from "./student-file-columns";
import type { StudentFields } from "./student-input";

/** Sent for a choice the file's text does not name. The form refuses it. */
const NOT_A_CHOICE = "";

const THIS_CENTURY = "20";
const SHORT_YEAR = /^\d{2}$/;
const YES = ["1", "ya", "y", "yes", "true"];
const FEMALE = ["p", "perempuan", "wanita"];
const MALE = ["l", "laki-laki", "laki laki", "pria"];

const CATEGORY_COLUMNS: readonly (readonly [FileColumn, CategoryField])[] = [
  ["afirmasi", "isAffirmation"],
  ["pembibitan", "isSeedling"],
  ["internasional", "isInternational"],
];

/** Text as it is compared: small letters, single spaces. */
function plain(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function programId(text: string, programs: StudyProgram[]): string {
  const program = programs.find((one) => plain(one.name) === plain(text));
  return program ? String(program.id) : NOT_A_CHOICE;
}

function entryPath(text: string): string {
  const path = plain(text);
  if (path === "" || path === "reguler") return "regular";
  return path.includes("alih") ? "transfer" : NOT_A_CHOICE;
}

function sex(text: string): string {
  if (FEMALE.includes(plain(text))) return "female";
  return MALE.includes(plain(text)) ? "male" : NOT_A_CHOICE;
}

/** A year may be written short: 26 is 2026. */
function cohortYear(text: string): string {
  return SHORT_YEAR.test(text) ? `${THIS_CENTURY}${text}` : text;
}

/** The entry of a fixed list as the list writes it, or the text as it is. */
function listed(list: readonly string[], text: string): string {
  return list.find((entry) => plain(entry) === plain(text)) ?? text;
}

function status(text: string): string {
  const named = plain(text);
  if (named === "" || named === "aktif") return "active";
  if (named === "cuti") return "on_leave";
  return named.includes("non") ? "inactive" : NOT_A_CHOICE;
}

function categories(cells: FileCells): string[] {
  const ticked = CATEGORY_COLUMNS.filter(([column]) =>
    YES.includes(plain(cells[column])),
  );
  return ticked.map(([, field]) => field);
}

/**
 * Turns the text of one file row into what the form would send, so that a
 * row is checked by the rules of the form and by nothing else. A text that
 * is not understood is passed on as a value those rules refuse.
 */
export function rowFields(
  cells: FileCells,
  programs: StudyProgram[],
): StudentFields {
  return {
    nim: cells.nim,
    name: cells.nama,
    email: cells.email,
    studyProgramId: programId(cells.prodi, programs),
    entryPath: entryPath(cells.jalur),
    sex: sex(cells.jenis_kelamin),
    cohortYear: cohortYear(cells.angkatan),
    className: cells.kelas,
    province: listed(PROVINCES, cells.provinsi),
    originAgency: listed(ORIGIN_AGENCIES, cells.instansi_asal),
    status: status(cells.status),
    categories: categories(cells),
  };
}
