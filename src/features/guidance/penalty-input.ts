import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import {
  PENALTY_CATEGORIES,
  PENALTY_LEVELS,
  type PenaltyCategory,
  type PenaltyLevel,
} from "@/discipline-penalties/penalty-kinds";
import type { Parsed } from "@/parsed";
import { dayRefusal, NEEDS_STUDENT } from "./note-input";
import {
  DECISION_NUMBER_MAX_LENGTH,
  OTHER_SOCIAL_WORK_MAX_LENGTH,
  PENALTY_DESCRIPTION_MAX_LENGTH,
  PENALTY_DESCRIPTION_MIN_LENGTH,
  type PenaltyStatus,
  SOCIAL_WORK_FORMS,
  SOCIAL_WORK_PLACES,
  type SocialWorkForm,
  type SocialWorkPlace,
} from "./penalty-ids";
import {
  type PenaltyRule,
  ruleOf,
  socialWorkEnd,
  statusOf,
} from "./penalty-rules";

/*
 * The checks of "Simpan pelanggaran". Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** What the tick for a penalty that ends the status sends when ticked. */
export const CONFIRMED = "1";

/** A penalty as the form sends it, every field as text. */
export interface SentPenalty {
  studentId: string;
  day: string;
  description: string;
  category: string;
  level: string;
  decisionNumber: string;
  socialWorkForms: string[];
  socialWorkOther: string;
  socialWorkPlace: string;
  socialWorkStart: string;
  /** "Saya memahami hukuman ini memberhentikan mahasiswa secara permanen ...". */
  confirmed: boolean;
}

/** What a Jenjang with kerja sosial keeps of it; all empty for one without. */
export interface SocialWorkInput {
  socialWorkForms: SocialWorkForm[];
  socialWorkOther: string;
  socialWorkPlace: SocialWorkPlace | null;
  socialWorkStartsOn: string | null;
  socialWorkEndsOn: string | null;
}

export interface PenaltyInput extends SocialWorkInput {
  studentId: string;
  day: string;
  description: string;
  category: PenaltyCategory;
  level: PenaltyLevel;
  status: PenaltyStatus;
  decisionNumber: string;
}

export const DESCRIPTION_TOO_SHORT = `Tulis uraian pelanggaran, minimal ${PENALTY_DESCRIPTION_MIN_LENGTH} huruf.`;
export const DESCRIPTION_TOO_LONG = `Uraian pelanggaran paling banyak ${PENALTY_DESCRIPTION_MAX_LENGTH} karakter.`;
export const DECISION_NUMBER_TOO_LONG = `Nomor keputusan paling banyak ${DECISION_NUMBER_MAX_LENGTH} karakter.`;
export const NEEDS_JENJANG = "Pilih kategori dan jenjang hukuman dari daftar.";
export const NEEDS_SOCIAL_WORK_FORM =
  "Pilih minimal satu bentuk kerja sosial dari daftar.";
export const NEEDS_OTHER_FORM = "Sebutkan bentuk kerja sosial lainnya.";
export const OTHER_FORM_TOO_LONG = `Bentuk kerja sosial lainnya paling banyak ${OTHER_SOCIAL_WORK_MAX_LENGTH} karakter.`;
export const NEEDS_PLACE = "Pilih lokasi kerja sosial dari daftar.";
export const NEEDS_START = "Isi tanggal mulai kerja sosial.";
export const START_BEFORE_DAY =
  "Mulai kerja sosial tidak boleh sebelum tanggal pelanggaran.";
export const NEEDS_CONFIRMATION =
  "Centang konfirmasi pemberhentian permanen terlebih dahulu.";

const NO_SOCIAL_WORK: SocialWorkInput = {
  socialWorkForms: [],
  socialWorkOther: "",
  socialWorkPlace: null,
  socialWorkStartsOn: null,
  socialWorkEndsOn: null,
};

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function categoryOf(sent: string): PenaltyCategory | null {
  return PENALTY_CATEGORIES.find((category) => category === sent) ?? null;
}

function levelOf(sent: string): PenaltyLevel | null {
  return PENALTY_LEVELS.find((level) => String(level) === sent) ?? null;
}

function placeOf(sent: string): SocialWorkPlace | null {
  return SOCIAL_WORK_PLACES.find((place) => place === sent) ?? null;
}

/** The Bentuk sent, each once and in the order of the list; null for one not on it. */
function formsOf(sent: string[]): SocialWorkForm[] | null {
  for (const form of sent) {
    if (!SOCIAL_WORK_FORMS.some((known) => known === form)) return null;
  }
  return SOCIAL_WORK_FORMS.filter((form) => sent.includes(form));
}

function otherFormOf(forms: SocialWorkForm[], sent: string): Parsed<string> {
  if (!forms.includes("other")) return { ok: true, value: "" };
  const other = sent.trim();
  if (other === "") return refused(NEEDS_OTHER_FORM);
  if (other.length > OTHER_SOCIAL_WORK_MAX_LENGTH) {
    return refused(OTHER_FORM_TOO_LONG);
  }
  return { ok: true, value: other };
}

/** The kerja sosial of a Jenjang that carries it: Bentuk, Lokasi, Mulai and its last day. */
function socialWorkOf(
  sent: SentPenalty,
  rule: PenaltyRule,
): Parsed<SocialWorkInput> {
  if (rule.socialWork === null) return { ok: true, value: NO_SOCIAL_WORK };
  const forms = formsOf(sent.socialWorkForms);
  if (forms === null || forms.length === 0) {
    return refused(NEEDS_SOCIAL_WORK_FORM);
  }
  const other = otherFormOf(forms, sent.socialWorkOther);
  if (!other.ok) return other;
  const place = placeOf(sent.socialWorkPlace);
  if (place === null) return refused(NEEDS_PLACE);
  const start = sent.socialWorkStart;
  if (!isDay(start)) return refused(NEEDS_START);
  if (start < sent.day) return refused(START_BEFORE_DAY);
  return {
    ok: true,
    value: {
      socialWorkForms: forms,
      socialWorkOther: other.value,
      socialWorkPlace: place,
      socialWorkStartsOn: start,
      socialWorkEndsOn: socialWorkEnd(start, rule.socialWork),
    },
  };
}

function descriptionOf(sent: string): Parsed<string> {
  const description = sent.trim();
  if (description.length < PENALTY_DESCRIPTION_MIN_LENGTH) {
    return refused(DESCRIPTION_TOO_SHORT);
  }
  if (description.length > PENALTY_DESCRIPTION_MAX_LENGTH) {
    return refused(DESCRIPTION_TOO_LONG);
  }
  return { ok: true, value: description };
}

/**
 * Checks a penalty as sent, on `today` on campus, with the stored
 * academic periods. Its status and the last day of its kerja sosial
 * follow from its Jenjang.
 */
export function parsePenalty(
  sent: SentPenalty,
  today: string,
  periods: readonly Pick<AcademicPeriod, "startsOn">[],
): Parsed<PenaltyInput> {
  if (!isUuid(sent.studentId)) return refused(NEEDS_STUDENT);
  const dayError = dayRefusal(sent.day, today, periods);
  if (dayError !== null) return refused(dayError);
  const description = descriptionOf(sent.description);
  if (!description.ok) return description;
  const decisionNumber = sent.decisionNumber.trim();
  if (decisionNumber.length > DECISION_NUMBER_MAX_LENGTH) {
    return refused(DECISION_NUMBER_TOO_LONG);
  }
  const category = categoryOf(sent.category);
  const level = levelOf(sent.level);
  if (category === null || level === null) return refused(NEEDS_JENJANG);
  const rule = ruleOf(category, level);
  const socialWork = socialWorkOf(sent, rule);
  if (!socialWork.ok) return socialWork;
  const status = statusOf(rule);
  if (status === "set" && !sent.confirmed) return refused(NEEDS_CONFIRMATION);
  return {
    ok: true,
    value: {
      studentId: sent.studentId,
      day: sent.day,
      description: description.value,
      category,
      level,
      status,
      decisionNumber,
      ...socialWork.value,
    },
  };
}
