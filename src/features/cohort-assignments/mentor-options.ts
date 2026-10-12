import { mentorLabel } from "@/ui/mentor-label";
import { choicesForProgram, type MentorCandidate } from "./mentor-choices";

/** A mentor that may be chosen, as the choice of a group names them. */
export interface PoolMentor extends MentorCandidate {
  title: string | null;
}

/** One line of the choice of a mentor for a group. */
export interface MentorOption {
  id: string;
  label: string;
}

/** What marks a mentor of the jurusan of the group's program studi. */
export const SAME_JURUSAN_MARK = "✓";

/** What the choice says of a chosen mentor who may not be chosen any more. */
export const NOT_OFFERED_WORDS = "tidak bisa dipilih lagi";

type Chosen = Pick<PoolMentor, "id" | "name" | "title">;

function optionLabel(mentor: PoolMentor, isSameJurusan: boolean): string {
  const named = `${mentorLabel(mentor)} · ${mentor.unit ?? "-"}`;
  return isSameJurusan ? `${named} ${SAME_JURUSAN_MARK}` : named;
}

/**
 * The choice of a mentor for a group of a program studi: the mentors that
 * may be chosen, those of the same jurusan first and marked. A mentor who
 * was chosen and may not be chosen any more stays in the choice, said so,
 * or the choice would show the group as having none.
 */
export function mentorOptions(
  pool: PoolMentor[],
  programName: string,
  chosen: Chosen | null,
): MentorOption[] {
  const options = choicesForProgram(pool, programName).map((choice) => ({
    id: choice.mentor.id,
    label: optionLabel(choice.mentor, choice.isSameJurusan),
  }));
  if (chosen === null) return options;
  if (options.some((option) => option.id === chosen.id)) return options;
  const label = `${mentorLabel(chosen)} (${NOT_OFFERED_WORDS})`;
  return [...options, { id: chosen.id, label }];
}
