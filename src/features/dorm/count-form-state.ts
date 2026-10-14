import type { FormState } from "@/ui/form-message";

/** What a save of a count says back, with what the form sends next. */
export interface CountFormState extends FormState {
  /**
   * Which save of the count the form holds. It stays the same after a
   * refusal, and is that of the count just kept after a save.
   */
  version: number;
  /** Whether the count kept is announced, so only "Umumkan ulang" is left. */
  isAnnounced: boolean;
}
