import type { DraftKey } from "./draft-change-input";

/**
 * A change to the groups of a draft as the tab sends it: the angkatan,
 * the version of the draft that is shown, and what the change names.
 */
export function changeForm(
  shown: DraftKey,
  fields: Record<string, string> = {},
): FormData {
  const form = new FormData();
  form.set("cohortYear", String(shown.cohortYear));
  form.set("version", String(shown.version));
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return form;
}
