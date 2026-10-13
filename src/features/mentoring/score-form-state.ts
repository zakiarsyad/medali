import type { FormState } from "@/ui/form-message";

/** What "Simpan nilai" says back. */
export interface ScoreFormState extends FormState {
  /**
   * The students whose score was saved in between, from another window:
   * their boxes go back to the score kept now. None after a save or any
   * other refusal.
   */
  changedIds: string[];
}
