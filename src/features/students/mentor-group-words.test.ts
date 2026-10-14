import { describe, expect, it } from "vitest";
import { mentorGroupWords, mentorWords } from "./mentor-group-words";
import type { StudentMentorGroup } from "./student-mentor-group";

const GROUP: StudentMentorGroup = {
  id: "00000000-0000-4000-8000-000000000001",
  studyProgramId: 7,
  mentorId: "00000000-0000-4000-8000-000000000002",
  cohortYear: 2024,
  entryPath: "regular",
  number: 1,
  programCode: "D3PJK",
  mentor: { name: "Sari Uji", title: "M.Si.", since: "2025-09-01" },
  earlierMentors: [],
};

describe("mentorWords", () => {
  it("names the mentor with the gelar", () => {
    expect(mentorWords(GROUP)).toBe("Sari Uji, M.Si.");
  });

  it("says Belum ditetapkan for a student without a group", () => {
    expect(mentorWords(null)).toBe("Belum ditetapkan");
  });

  it("says Belum ditetapkan for a group left without a mentor", () => {
    expect(mentorWords({ ...GROUP, mentor: null })).toBe("Belum ditetapkan");
  });
});

describe("mentorGroupWords", () => {
  it("says the group and since when its mentor holds it", () => {
    expect(mentorGroupWords(GROUP)).toBe(
      "Kelompok pengasuhan KP 24-D3PJK-01, diasuh sejak 1 Sep 2025.",
    );
  });

  it("adds the mentors before when the group has had any", () => {
    const group = { ...GROUP, earlierMentors: ["Awal Uji", "Tengah Uji"] };

    expect(mentorGroupWords(group)).toBe(
      "Kelompok pengasuhan KP 24-D3PJK-01, diasuh sejak 1 Sep 2025. Sebelumnya: Awal Uji, Tengah Uji.",
    );
  });

  it("says the group alone when it is left without a mentor", () => {
    expect(mentorGroupWords({ ...GROUP, mentor: null })).toBe(
      "Kelompok pengasuhan KP 24-D3PJK-01.",
    );
  });

  it("still names the mentors before for a group left without a mentor", () => {
    const group = { ...GROUP, mentor: null, earlierMentors: ["Awal Uji"] };

    expect(mentorGroupWords(group)).toBe(
      "Kelompok pengasuhan KP 24-D3PJK-01. Sebelumnya: Awal Uji.",
    );
  });
});
