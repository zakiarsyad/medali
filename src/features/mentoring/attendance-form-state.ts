import type { FormState } from "@/ui/form-message";

/** What "Simpan daftar hadir" says back, with the version the form sends next. */
export interface AttendanceFormState extends FormState {
  /**
   * Which save of the list the form holds. It stays the same after a
   * refusal, and is that of the list just kept after a save.
   */
  version: number;
}
