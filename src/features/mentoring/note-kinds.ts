import {
  FOLLOW_UPS,
  type FollowUp,
  NOTE_KINDS,
  type NoteKind,
} from "@/mentoring/note-ids";
import type { ValueKey } from "@/ui/medali-values";

/**
 * The MEDALI values the form ticks when a kind is chosen, as in the
 * prototype. The mentor is free to change them.
 */
export const KIND_VALUES: Record<NoteKind, readonly ValueKey[]> = {
  individual_counselling: ["M", "A"],
  group_mentoring: ["L", "I", "E"],
  appreciation: ["E", "I"],
  attendance_monitoring: ["D"],
  discipline_guidance: ["D", "I"],
  parent_visit: ["M", "E"],
};

export function isNoteKind(sent: string): sent is NoteKind {
  return NOTE_KINDS.some((kind) => kind === sent);
}

export function isFollowUp(sent: string): sent is FollowUp {
  return FOLLOW_UPS.some((followUp) => followUp === sent);
}
