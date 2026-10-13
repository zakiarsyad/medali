import type { FormState } from "@/ui/form-message";

/** What "Simpan catatan" says back, with the key the form sends next. */
export interface NoteFormState extends FormState {
  /**
   * The key of the note the form will send. It stays the same after a
   * refusal, and is a new one after a save.
   */
  noteId: string;
}
