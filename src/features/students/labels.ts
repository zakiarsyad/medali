import type { StudentInputSource, students } from "@/db/schema";

type Student = typeof students.$inferSelect;

/** The words the screens show for the fixed choices of a student record. */
export const SEX_LABELS: Record<Student["sex"], string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

export const ENTRY_PATH_LABELS: Record<Student["entryPath"], string> = {
  regular: "Reguler",
  transfer: "Alih program",
};

export const STATUS_LABELS: Record<Student["status"], string> = {
  active: "Aktif",
  on_leave: "Cuti",
  inactive: "Non Aktif",
};

export const INPUT_SOURCE_LABELS: Record<StudentInputSource, string> = {
  form: "Formulir",
  edit: "Ubah data",
};

export const CATEGORIES = [
  { field: "isAffirmation", label: "Afirmasi" },
  { field: "isSeedling", label: "Pembibitan" },
  { field: "isInternational", label: "Internasional" },
  { field: "isBlended", label: "Blended learning" },
] as const;

export type CategoryField = (typeof CATEGORIES)[number]["field"];
