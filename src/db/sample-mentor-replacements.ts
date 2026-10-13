import type {
  OldMentorStatus,
  ReplacementReason,
} from "@/mentoring/replacement-ids";
import {
  isGroupOf,
  SAMPLE_REPLACEMENT,
  type SampleMentorGroup,
} from "./sample-mentor-groups";

/*
 * Made-up people only. The letter number and the note here are invented.
 */

export interface SampleMentorReplacement {
  group: SampleMentorGroup;
  /** The name of the sample Pengasuh who held the group until then. */
  oldMentor: string;
  /** The name of the sample Pengasuh who holds it since. */
  newMentor: string;
  startsOn: string;
  reason: ReplacementReason;
  letterNumber: string;
  oldMentorStatus: OldMentorStatus;
  note: string | null;
}

const NOTE =
  "Pengasuh lama meminta pengurangan beban tugas. Kelompok dilanjutkan pengasuh cadangan dari jurusan yang sama.";

function letterNumber(startsOn: string): string {
  return `ND-45/UPK/${startsOn.slice(0, 4)}`;
}

/**
 * The one made-up replacement, read from the mentor lines of its sample
 * group so that the two always agree: it started the day the new mentor's
 * line starts, and the old mentor is Cadangan since. Empty when the group
 * is not among `groups`.
 */
export function sampleMentorReplacements(
  groups: SampleMentorGroup[],
): SampleMentorReplacement[] {
  const group = groups.find((each) => isGroupOf(each, SAMPLE_REPLACEMENT));
  const [oldLine, newLine] = group?.mentors ?? [];
  if (!group || !oldLine || !newLine) return [];
  return [
    {
      group,
      oldMentor: oldLine.name,
      newMentor: newLine.name,
      startsOn: newLine.startsOn,
      reason: SAMPLE_REPLACEMENT.reason,
      letterNumber: letterNumber(newLine.startsOn),
      oldMentorStatus: "reserve",
      note: NOTE,
    },
  ];
}
