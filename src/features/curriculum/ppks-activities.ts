import type { ValueKey } from "@/ui/medali-values";

/** One PPKS activity of a semester, as the list shows it. */
export interface PpksActivity {
  id: string;
  semester: number;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
  isRequired: boolean;
  description: string;
}

/** The small line under the name of an activity. */
export function activityNote(description: string, isRequired: boolean): string {
  const parts = [description, isRequired ? "" : "tidak wajib"];
  return parts.filter((part) => part !== "").join(" · ");
}
