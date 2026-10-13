import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const EVALUATION_ADDRESS = "/pengasuh/ganti";

/** The part of the address that names the group chosen on the form. */
export const CHOSEN_GROUP_PARAM = "kelompok";

/** The part of the address that names which of the two forms is open. */
export const CHOSEN_PART_PARAM = "bagian";

/**
 * The part of the address that names the period of the evaluation whose
 * saving opened the form of a replacement.
 */
export const SAVED_PERIOD_PARAM = "periode";

/** The two forms of the tab, in the order the switch shows them. */
export const FORM_PARTS = ["evaluation", "replacement"] as const;

export type FormPart = (typeof FORM_PARTS)[number];

/** What the address says for the form of a replacement. Evaluasi needs no word. */
export const REPLACEMENT_PART_WORD = "penggantian";

/**
 * The group the address asks the form for, or null when it names none.
 * Nothing in an address is trusted: what has not the shape of a row id
 * counts as not asked.
 */
export function readChosenGroup(params: SearchParams): string | null {
  const asked = firstParam(params[CHOSEN_GROUP_PARAM]).trim();
  return isUuid(asked) ? asked : null;
}

/** The form the address asks for: Evaluasi unless it names Penggantian. */
export function readChosenPart(params: SearchParams): FormPart {
  const asked = firstParam(params[CHOSEN_PART_PARAM]).trim();
  return asked === REPLACEMENT_PART_WORD ? "replacement" : "evaluation";
}

/**
 * The period of the evaluation whose saving opened the form of a
 * replacement, or null when the address names none.
 */
export function readSavedPeriod(params: SearchParams): string | null {
  const asked = firstParam(params[SAVED_PERIOD_PARAM]).trim();
  return isUuid(asked) ? asked : null;
}

/** The address of the tab with one of its forms open, for a group or for none. */
export function formAddress(part: FormPart, groupId: string | null): string {
  const params = new URLSearchParams();
  if (part === "replacement") {
    params.set(CHOSEN_PART_PARAM, REPLACEMENT_PART_WORD);
  }
  if (groupId !== null) params.set(CHOSEN_GROUP_PARAM, groupId);
  if (params.size === 0) return EVALUATION_ADDRESS;
  return `${EVALUATION_ADDRESS}?${params}`;
}

/** The address of the tab with the form of an evaluation open for one group. */
export function evaluationAddress(groupId: string): string {
  return formAddress("evaluation", groupId);
}

/** The address of the tab with the form of a replacement open for one group. */
export function replacementAddress(groupId: string): string {
  return formAddress("replacement", groupId);
}

/**
 * Where saving an evaluation of Kurang leads: the form of a replacement
 * for the same group, which then says what was saved for that period.
 */
export function afterPoorEvaluationAddress(
  groupId: string,
  periodId: string,
): string {
  const params = new URLSearchParams({ [SAVED_PERIOD_PARAM]: periodId });
  return `${replacementAddress(groupId)}&${params}`;
}
