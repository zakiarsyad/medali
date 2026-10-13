import { describe, expect, it } from "vitest";
import { oldMentorStatusFor } from "@/features/mentor-groups/old-mentor-status";
import { SAMPLE_STUDENTS } from "./sample-data";
import {
  isGroupOf,
  SAMPLE_MENTORS_WITHOUT_GROUP,
  SAMPLE_REPLACEMENT,
  sampleMentorGroups,
} from "./sample-mentor-groups";
import { sampleMentorReplacements } from "./sample-mentor-replacements";
import { sampleGroupedFirstYears } from "./sample-new-intake";

const DAY = "2026-10-13";
const groups = sampleMentorGroups(
  [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(2026)],
  DAY,
);
const replacements = sampleMentorReplacements(groups);

describe("sampleMentorReplacements", () => {
  it("is one replacement, of a sample group", () => {
    expect(replacements).toHaveLength(1);
    expect(groups).toContain(replacements[0]?.group);
  });

  it("started in the past of the calendar year of the day", () => {
    const startsOn = replacements[0]?.startsOn ?? "";

    expect(startsOn < DAY).toBe(true);
    expect(startsOn.slice(0, 4)).toBe(DAY.slice(0, 4));
  });

  it("agrees with the mentor lines of its group", () => {
    const [replacement] = replacements;
    const [oldLine, newLine] = replacement?.group.mentors ?? [];

    expect(replacement?.group.mentors).toHaveLength(2);
    expect(oldLine).toMatchObject({
      name: replacement?.oldMentor,
      endsOn: replacement?.startsOn,
      endReason: "Permintaan sendiri",
    });
    expect(newLine).toMatchObject({
      name: replacement?.newMentor,
      startsOn: replacement?.startsOn,
      endsOn: null,
    });
  });

  it("leaves the old mentor Cadangan, as its reason does, with a letter number", () => {
    const [replacement] = replacements;

    expect(replacement?.reason).toBe(SAMPLE_REPLACEMENT.reason);
    expect(replacement?.oldMentorStatus).toBe("reserve");
    expect(oldMentorStatusFor(SAMPLE_REPLACEMENT.reason)).toBe("reserve");
    expect(SAMPLE_MENTORS_WITHOUT_GROUP).toContain(replacement?.oldMentor);
    expect(replacement?.letterNumber).toBe("ND-45/UPK/2026");
  });

  it("is empty without its group", () => {
    const others = groups.filter(
      (group) => !isGroupOf(group, SAMPLE_REPLACEMENT),
    );

    expect(sampleMentorReplacements(others)).toEqual([]);
  });
});
