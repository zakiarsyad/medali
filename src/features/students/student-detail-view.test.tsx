// Sample NIMs of this file: 9900002500 to 9900002599. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentDetail } from "./student-detail";
import { StudentDetailView } from "./student-detail-view";
import type {
  GroupAddressOf,
  StudentMentorGroup,
} from "./student-mentor-group";

const GROUP: StudentMentorGroup = {
  id: "00000000-0000-4000-8000-000000000093",
  studyProgramId: 1,
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

const mayOpenGroup: GroupAddressOf = () => GROUP_PAGE;
const mayNotOpenGroup: GroupAddressOf = () => null;

function viewOf(student: StudentDetail, groupAddressOf: GroupAddressOf) {
  return renderToStaticMarkup(
    <StudentDetailView
      student={student}
      period={PERIOD}
      groupAddressOf={groupAddressOf}
    />,
  );
}

describe("StudentDetailView", () => {
  it("links the mentor's name to the group's page for an account that may open it", () => {
    const view = viewOf(STUDENT, mayOpenGroup);

    expect(view).toMatch(
      /<a[^>]*href="\/pengasuh\/kelompok\/uji"[^>]*>Pengasuh Uji Detail, M\.Si\.<\/a>/,
    );
  });

  it("names the mentor as plain text for an account that may not open the group's page", () => {
    const view = viewOf(STUDENT, mayNotOpenGroup);

    expect(view).toContain("Pengasuh Uji Detail, M.Si.");
    expect(view).not.toContain("<a");
  });

  it("links nothing for a group left without a mentor", () => {
    const student = { ...STUDENT, mentorGroup: { ...GROUP, mentor: null } };

    const view = viewOf(student, mayOpenGroup);

    expect(view).toContain("Belum ditetapkan");
    expect(view).not.toContain("<a");
  });

  it("links nothing for a student in no group", () => {
    const view = viewOf({ ...STUDENT, mentorGroup: null }, mayOpenGroup);

    expect(view).toContain("Belum ditetapkan");
    expect(view).not.toContain("<a");
  });
});
