import { shortLine } from "@/files/csv-file";
import {
  LATER_BIRTH_DATE,
  MALFORMED_BIRTH_DATE,
  UNREAL_BIRTH_DATE,
} from "./birth-date";
import { type FileCells, yearRange } from "./student-file-columns";
import {
  type InputContext,
  invalidCohort,
  NO_RELIGION,
  UNKNOWN_AGENCY,
  UNKNOWN_PROGRAM,
  UNKNOWN_PROVINCE,
  UNKNOWN_RELIGION,
  UNKNOWN_SEX,
} from "./student-input";

const SHOWN_TEXT_LENGTH = 40;

/** A refusal with the text the file holds, so the mistake is easy to find. */
function withText(refusal: string, text: string): string {
  if (text === "") return refusal;
  const reason = refusal.replace(/\.$/, "");
  return `${reason}: ${shortLine(text, SHOWN_TEXT_LENGTH)}.`;
}

/** A file sends no Agama for a text it does not know: the text is named. */
function religionReason(text: string): string {
  if (text === "") return "Agama wajib diisi.";
  return withText(UNKNOWN_RELIGION, text);
}

/** A Tanggal lahir that is filled but refused: the text is named. */
const BIRTH_DATE_REFUSALS = [
  MALFORMED_BIRTH_DATE,
  UNREAL_BIRTH_DATE,
  LATER_BIRTH_DATE,
];

/**
 * Why a row of a file is skipped, from why the form refuses it. The rule
 * is the form's. The words differ where a file holds text and the form a
 * choice: the text is named, and the notes of the file are followed.
 */
export function fileReason(
  formRefusal: string,
  cells: FileCells,
  context: InputContext,
): string {
  if (formRefusal === UNKNOWN_PROGRAM)
    return withText(formRefusal, cells.prodi);
  if (formRefusal === UNKNOWN_SEX) return "Jenis kelamin harus L atau P.";
  if (formRefusal === NO_RELIGION) return religionReason(cells.agama);
  if (formRefusal === invalidCohort(context.cohortYears)) {
    return `Angkatan harus ${yearRange(context.cohortYears)}.`;
  }
  if (formRefusal === UNKNOWN_PROVINCE) {
    return withText(formRefusal, cells.provinsi);
  }
  if (formRefusal === UNKNOWN_AGENCY) {
    return withText(formRefusal, cells.instansi_asal);
  }
  if (BIRTH_DATE_REFUSALS.includes(formRefusal)) {
    return withText(formRefusal, cells.tanggal_lahir);
  }
  return formRefusal;
}
