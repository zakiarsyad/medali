import { isOfJurusan } from "./jurusan";
import type { MentorCandidate } from "./mentor-choices";

/** What filling in mentors reads of a group being prepared. */
export interface GroupToFill {
  /** The name of the group's program studi, which names its jurusan. */
  programName: string;
  mentorId: string | null;
}

type PoolMentor = Pick<MentorCandidate, "id" | "unit">;

function firstFree(
  pool: PoolMentor[],
  used: Set<string>,
  programName: string,
): PoolMentor | null {
  const free = pool.filter((mentor) => !used.has(mentor.id));
  const sameJurusan = free.find((mentor) =>
    isOfJurusan(mentor.unit, programName),
  );
  return sameJurusan ?? free[0] ?? null;
}

/**
 * "Isi otomatis yang kosong": gives each group without a mentor, in the
 * order given, the first mentor of the pool that no group has yet and
 * that is of the group's jurusan, or else the first that no group has
 * yet. A mentor already chosen stays, and a group stays empty once the
 * pool runs out. The pool is the mentors that may be chosen, in the order
 * to take them.
 */
export function fillEmptyMentors<G extends GroupToFill>(
  groups: G[],
  pool: PoolMentor[],
): G[] {
  const used = new Set<string>();
  for (const group of groups) {
    if (group.mentorId !== null) used.add(group.mentorId);
  }
  return groups.map((group) => {
    if (group.mentorId !== null) return group;
    const mentor = firstFree(pool, used, group.programName);
    if (mentor === null) return group;
    used.add(mentor.id);
    return { ...group, mentorId: mentor.id };
  });
}
