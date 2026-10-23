import type { GradeScheme } from "@/character-grades/scheme-ids";
import type { Scores } from "@/character-scores/assessment-score";
import type {
  PenaltyCategory,
  PenaltyLevel,
} from "@/discipline-penalties/penalty-kinds";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import type { GroupCodeParts } from "@/ui/group-code";
import type { Recap } from "./achievement-recap";
import type { GradeRecap } from "./grade-recap";
import type { PublishedMental } from "./mental-recap";
import type { AttentionRow } from "./mentee-attention";
import type { MenteeNoteNumbers } from "./mentee-notes";
import type { MentoringProgress } from "./mentee-progress";
import type { LatestNote } from "./mentoring-recap";
import type { PhysicalRecap } from "./physical-recap";

/*
 * Dashboard anak asuh, as it may leave the server. Read by the screen
 * parts, so nothing here may take from the database code.
 */

/** A group in force that a mentor holds today. */
export interface MenteeGroup extends GroupCodeParts {
  id: string;
}

/** The four cards and sections 1 to 4, of the anak asuh only, with no number held back. */
export interface MenteeCards {
  /** Null while none is assessed. */
  achievement: Recap | null;
  grades: { recap: GradeRecap; scheme: GradeScheme };
  physical: PhysicalRecap;
  /** The counselling data published to the Pengasuh: no anonymous count. */
  published: PublishedMental;
}

/** How many penalties "Pelanggaran disiplin" shows at most, as in the prototype. */
export const PENALTIES_SHOWN = 5;

/** A discipline penalty of an anak asuh, as "Pelanggaran disiplin" shows it. */
export interface MenteePenalty {
  id: string;
  studentId: string;
  name: string;
  /** Whether the account may open the student's detail. */
  opensDetail: boolean;
  /** Tanggal pelanggaran. */
  day: string;
  category: PenaltyCategory;
  level: PenaltyLevel;
  /** Uraian pelanggaran. */
  description: string;
}

/** An anak asuh as the table "Anak asuh" shows them. */
export interface MenteeMember {
  studentId: string;
  name: string;
  nim: string;
  className: string | null;
  /** The semester of the running period, or null while none runs. */
  semester: number | null;
  /** The latest six scores as shown, or null while not assessed. */
  scores: Scores | null;
  /** Whether the account may open the student's detail. */
  opensDetail: boolean;
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
  /** The limits in force, which give each fitness category its scores. */
  fitnessLimits: FitnessLimits;
  /** "Pelanggaran disiplin": the latest penalties of the anak asuh, newest first. */
  penalties: MenteePenalty[];
  /** "Anak asuh": every Aktif anak asuh, the lowest Rerata first and those not assessed last. */
  members: MenteeMember[];
  /** "Perlu perhatian": the anak asuh with a reason, the most reasons first. */
  attention: AttentionRow[];
  /** "Catatan pengasuhan terbaru", the newest first. */
  notes: LatestNote[];
  noteNumbers: MenteeNoteNumbers;
}

/** Dashboard anak asuh: only the message while no group is held. */
export type MenteeDashboard =
  | { kind: "no_group" }
  | ({ kind: "shown" } & MenteeContent);
