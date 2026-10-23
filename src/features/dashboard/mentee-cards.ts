import type { GradeBasis } from "@/character-grades/grade-facts";
import type { Database } from "@/db/connect";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import { readAchievement } from "./achievement-read";
import { NONE_HELD_BACK } from "./achievement-recap";
import { readCharacterGrades } from "./grade-read";
import { readPublishedCounts } from "./mental-read";
import type { PublishedCounts } from "./mental-recap";
import type { MenteeCards } from "./mentee-recap";
import type { MenteeScope } from "./mentee-scope";
import { readPhysical } from "./physical-read";

const NONE_PUBLISHED: PublishedCounts = { matching: 0, needCounselling: 0 };

/**
 * The four cards of Dashboard anak asuh and sections 1 to 3 below them,
 * by the rules of the main Dashboard, but with no number held back: its
 * Pengasuh sees each anak asuh's own values in Pengasuhan anyway, and
 * their health notes in Penilaian jasmani.
 */
export async function readMenteeCards(
  db: Database,
  scope: MenteeScope,
  basis: GradeBasis,
  limits: FitnessLimits,
): Promise<MenteeCards> {
  const where = scope.mentees;
  const [achievement, grades, physical, published] = await Promise.all([
    readAchievement(db, where, false, NONE_HELD_BACK),
    readCharacterGrades(db, where, basis, false, NONE_HELD_BACK),
    readPhysical(db, limits, where, scope.illnesses, NONE_HELD_BACK),
    scope.shared === null
      ? NONE_PUBLISHED
      : readPublishedCounts(db, where, scope.shared),
  ]);
  return {
    achievement: achievement.recap,
    grades: { recap: grades.recap, scheme: grades.scheme },
    physical,
    published,
  };
}
