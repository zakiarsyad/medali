// Sample NIMs of this file: 9900002500 to 9900002599. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentDetail } from "./student-detail";
import { StudentDetailView } from "./student-detail-view";
import type {
  GroupAddressOf,
  MentorAddressOf,
  StudentMentorGroup,
} from "./student-mentor-group";

const MENTOR_ID = "00000000-0000-4000-8000-000000000095";

const GROUP: StudentMentorGroup = {
  id: "00000000-0000-4000-8000-000000000093",
  studyProgramId: 1,
  mentorId: MENTOR_ID,
  cohortYear: 2025,
  entryPath: "regular",
  number: 1,
  programCode: "UJI",
  mentor: { name: "Pengasuh Uji Detail", title: "M.Si.", since: "2025-08-01" },
  earlierMentors: [],
};

const STUDENT: StudentDetail = {
  id: "00000000-0000-4000-8000-000000000094",
  nim: "9900002501",
  name: "Detail Uji Layar",
  status: "active",
  isAffirmation: false,
  isSeedling: false,
  isInternational: false,
  isBlended: false,
  studyProgram: "Prodi Uji Detail",
  entryPath: "regular",
  originAgency: null,
  cohortYear: 2025,
  className: null,
  province: "Bali",
  sex: "female",
  mentorGroup: GROUP,
  residence: null,
};

const PERIOD = { startYear: 2026, term: "odd" } as const;
const GROUP_PAGE = "/pengasuh/kelompok/uji";

const MENTOR_PAGE = "/pengasuh/daftar/uji";

const mayOpenGroup: GroupAddressOf = () => GROUP_PAGE;
const mayNotOpenGroup: GroupAddressOf = () => null;
const mayOpenMentor: MentorAddressOf = () => MENTOR_PAGE;
const mayNotOpenMentor: MentorAddressOf = () => null;

const NAME_TO_MENTOR =
  /<a[^>]*href="\/pengasuh\/daftar\/uji"[^>]*>Pengasuh Uji Detail, M\.Si\.<\/a>/;
const CODE_TO_GROUP =
  /<a[^>]*href="\/pengasuh\/kelompok\/uji"[^>]*>KP 25-UJI-01<\/a>/;

function viewOf(
  student: StudentDetail,
  groupAddressOf: GroupAddressOf,
  mentorAddressOf: MentorAddressOf,
) {
  return renderToStaticMarkup(
    <StudentDetailView
      student={student}
      period={PERIOD}
      groupAddressOf={groupAddressOf}
      mentorAddressOf={mentorAddressOf}
    />,
  );
}

function linksIn(view: string): number {
  return view.split("<a ").length - 1;
}

describe("StudentDetailView", () => {
  it("links the mentor's name to the mentor's page and the group's code to the group's page", () => {
    const view = viewOf(STUDENT, mayOpenGroup, mayOpenMentor);

    expect(view).toMatch(NAME_TO_MENTOR);
    expect(view).toMatch(CODE_TO_GROUP);
    expect(linksIn(view)).toBe(2);
  });

  it("asks for the mentor's address with the mentor of today and their group", () => {
    const asked: unknown[] = [];
    const remember: MentorAddressOf = (mentorId, group) => {
      asked.push([mentorId, group]);
      return MENTOR_PAGE;
    };

    viewOf(STUDENT, mayOpenGroup, remember);

    expect(asked).toEqual([[MENTOR_ID, GROUP]]);
  });

  it("names the mentor as plain text for an account that may open only the group's page", () => {
    const view = viewOf(STUDENT, mayOpenGroup, mayNotOpenMentor);

    expect(view).toContain("Pengasuh Uji Detail, M.Si.");
    expect(view).toMatch(CODE_TO_GROUP);
    expect(linksIn(view)).toBe(1);
  });

  it("names the group's code as plain text for an account that may open only the mentor's page", () => {
    const view = viewOf(STUDENT, mayNotOpenGroup, mayOpenMentor);

    expect(view).toMatch(NAME_TO_MENTOR);
    expect(view).toContain(
      "Kelompok pengasuhan KP 25-UJI-01, diasuh sejak 1 Agu 2025.",
    );
    expect(linksIn(view)).toBe(1);
  });

  it("links nothing for an account that may open neither page", () => {
    const view = viewOf(STUDENT, mayNotOpenGroup, mayNotOpenMentor);

    expect(view).toContain("Pengasuh Uji Detail, M.Si.");
    expect(view).toContain(
      "Kelompok pengasuhan KP 25-UJI-01, diasuh sejak 1 Agu 2025.",
    );
    expect(linksIn(view)).toBe(0);
  });

  it("keeps Belum ditetapkan as plain text for a group left without a mentor, and still links its code", () => {
    const group = { ...GROUP, mentorId: null, mentor: null };
    const student = { ...STUDENT, mentorGroup: group };

    const view = viewOf(student, mayOpenGroup, mayOpenMentor);

    expect(view).toContain("<dd>Belum ditetapkan<small");
    expect(view).toMatch(CODE_TO_GROUP);
    expect(linksIn(view)).toBe(1);
  });

  it("links nothing for a student in no group", () => {
    const student = { ...STUDENT, mentorGroup: null };

    const view = viewOf(student, mayOpenGroup, mayOpenMentor);

    expect(view).toContain("Belum ditetapkan");
    expect(linksIn(view)).toBe(0);
  });
});
