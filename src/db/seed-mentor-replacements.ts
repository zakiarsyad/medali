import type { Database } from "./connect";
import {
  type SampleMentorReplacement,
  sampleMentorReplacements,
} from "./sample-mentor-replacements";
import { mentorReplacements } from "./schema";
import { type AddedGroup, mentorIdsByName } from "./seed-mentor-groups";

type NewReplacement = typeof mentorReplacements.$inferInsert;

function idOf(ids: Map<string, string>, key: string, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample replacement names a ${what} that is missing.`);
  }
  return id;
}

/** The moment a sample replacement was set: the noon of its day, or now. */
function setAt(startsOn: string, now: Date): Date {
  const noon = new Date(`${startsOn}T12:00:00+07:00`);
  return noon < now ? noon : now;
}

/**
 * Adds the sample replacement as the work of the sample Kepala Unit, set
 * for its own day and so carried out at once. The groups with their
 * mentor lines, which already show it, must be there.
 */
export async function addSampleMentorReplacements(
  db: Database,
  groups: AddedGroup[],
  by: string,
): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const replacements = sampleMentorReplacements(samples);
  if (replacements.length === 0) return;
  const groupIds = new Map(groups.map((group) => [group.sample, group.id]));
  const mentorIds = await mentorIdsByName(db, samples);
  const now = new Date();

  function newReplacement(sample: SampleMentorReplacement): NewReplacement {
    const { group, oldMentor, newMentor, ...words } = sample;
    const groupId = groupIds.get(group);
    if (groupId === undefined) {
      throw new Error("A sample replacement names a group that is missing.");
    }
    const at = setAt(sample.startsOn, now);
    return {
      ...words,
      groupId,
      oldMentorId: idOf(mentorIds, oldMentor, "Pengasuh"),
      newMentorId: idOf(mentorIds, newMentor, "Pengasuh"),
      setBy: by,
      setAt: at,
      carriedOutAt: at,
    };
  }

  await db.insert(mentorReplacements).values(replacements.map(newReplacement));
}
