import type { GroupCodeParts } from "@/ui/group-code";
import type { MentoringProgress } from "./mentee-progress";

/*
 * Dashboard anak asuh, as it may leave the server. Read by the screen
 * parts, so nothing here may take from the database code.
 */

/** A group in force that a mentor holds today. */
export interface MenteeGroup extends GroupCodeParts {
  id: string;
}

/** What Dashboard anak asuh shows of a Pengasuh who holds a group today. */
export interface MenteeContent {
  /** The groups in force they hold today, the newest angkatan first. */
  groups: MenteeGroup[];
  /** Their Aktif anak asuh. */
  students: number;
  /** What they have filled in this semester, or null while no period runs. */
  progress: MentoringProgress | null;
}

/** Dashboard anak asuh: only the message while no group is held. */
export type MenteeDashboard =
  | { kind: "no_group" }
  | ({ kind: "shown" } & MenteeContent);
