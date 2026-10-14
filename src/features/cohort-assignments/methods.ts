/** The ways to split new students into groups, in the order of the choice. */
export const ASSIGNMENT_METHODS = ["balanced", "by_nim", "by_class"] as const;

export type AssignmentMethod = (typeof ASSIGNMENT_METHODS)[number];

/** The method a penetapan starts with. */
export const DEFAULT_METHOD: AssignmentMethod = "balanced";

export const METHOD_TITLES: Record<AssignmentMethod, string> = {
  balanced: "Seimbang jenis kelamin dan provinsi",
  by_nim: "Urut NIM",
  by_class: "Mengikuti kelas akademik",
};

/** The method a form names, or null for a text that names none. */
export function methodOf(text: string): AssignmentMethod | null {
  return ASSIGNMENT_METHODS.find((method) => method === text) ?? null;
}
