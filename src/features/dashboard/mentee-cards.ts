import type { GradeBasis } from "@/character-grades/grade-facts";
import type { Database } from "@/db/connect";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import { readPhysical } from "@/health-notes/fitness-recap-read";
import { readAchievement } from "./achievement-read";
import { NONE_HELD_BACK } from "./achievement-recap";
import { readCharacterGrades } from "./grade-read";
import { readPublished } from "./mental-read";
import type { PublishedMental } from "./mental-recap";
import type { MenteeCards } from "./mentee-recap";
import type { MenteeScope } from "./mentee-scope";

const NONE_PUBLISHED: PublishedMental = {
  matching: 0,
  needCounselling: 0,
  rows: [],
};

/**
 * The four cards of Dashboard anak asuh and sections 1 to 4 below them,
 * by the rules of the main Dashboard, but with no number held back: its
 * Pengasuh sees each anak asuh's own values in Pengasuhan anyway, and
 * their health notes in Penilaian jasmani. Of Kesehatan mental only what
 * is published to the Pengasuh, each record shown logged as read.
 */
export async function readMenteeCards(
  db: Database,
  scope: MenteeScope,
  basis: GradeBasis,
  limits: FitnessLimits,
  now: Date = new Date(),
): Promise<MenteeCards> {
  const where = scope.mentees;
  const [achievement, grades, physical, published] = await Promise.all([
    readAchievement(db, where, false, NONE_HELD_BACK),
    readCharacterGrades(db, where, basis, false, NONE_HELD_BACK),
    readPhysical(db, limits, where, scope.illnesses, NONE_HELD_BACK),
    scope.shared === null
      ? NONE_PUBLISHED
      : readPublished(db, where, scope.shared, now),
  ]);
  return {
    achievement: achievement.recap,
    grades: { recap: grades.recap, scheme: grades.scheme },
    physical,
    published,
  };
}
