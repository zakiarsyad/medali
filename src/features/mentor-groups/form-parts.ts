import type { AccountForAccess, RowLimit } from "@/auth/access";
import { FORM_PARTS, type FormPart } from "./evaluation-address";
import { evaluatedRowsFor } from "./visible-evaluations";
import { replacedRowsFor } from "./visible-replacements";

/**
 * The groups an account may use each form of the tab for, or null for a
 * form it may not use.
 */
export type FormLimits = Record<FormPart, RowLimit | null>;

/**
 * What an account may use each form of the tab for, by the right each
 * form asks: an account that only reads the tab gets no form.
 */
export function formLimitsFor(account: AccountForAccess): FormLimits {
  return {
    evaluation: evaluatedRowsFor(account),
    replacement: replacedRowsFor(account),
  };
}

/**
 * The form the tab opens: the one asked for when the account may use it,
 * else the first one it may use. Null for an account that only reads.
 */
export function openPart(asked: FormPart, limits: FormLimits): FormPart | null {
  if (limits[asked] !== null) return asked;
  return FORM_PARTS.find((part) => limits[part] !== null) ?? null;
}
