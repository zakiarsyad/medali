import type { GradeScheme } from "@/character-grades/scheme-ids";
import type { GroupCodeParts } from "@/ui/group-code";
import type { Recap } from "./achievement-recap";
import type { GradeRecap } from "./grade-recap";
import type { PublishedCounts } from "./mental-recap";
import type { MentoringProgress } from "./mentee-progress";
import type { PhysicalRecap } from "./physical-recap";

/*
 * Dashboard anak asuh, as it may leave the server. Read by the screen
 * parts, so nothing here may take from the database code.
 */

/** A group in force that a mentor holds today. */
export interface MenteeGroup extends GroupCodeParts {
  id: string;
}

/** The four cards, of the anak asuh only, with no number held back. */
export interface MenteeCards {
  /** Null while none is assessed. */
  achievement: Recap | null;
  grades: { recap: GradeRecap; scheme: GradeScheme };
  physical: PhysicalRecap;
  /** The counselling data published to the Pengasuh. */
  published: PublishedCounts;
}

/** What Dashboard anak asuh shows of a Pengasuh who holds a group today. */
export interface MenteeContent {
  /** The groups in force they hold today, the newest angkatan first. */
  groups: MenteeGroup[];
  /** Their Aktif anak asuh. */
  students: number;
  /** What they have filled in this semester, or null while no period runs. */
  progress: MentoringProgress | null;
  cards: MenteeCards;
}

/** Dashboard anak asuh: only the message while no group is held. */
export type MenteeDashboard =
  | { kind: "no_group" }
  | ({ kind: "shown" } & MenteeContent);
