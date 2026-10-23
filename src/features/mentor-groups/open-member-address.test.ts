import { describe, expect, it } from "vitest";
import { groupMemberAddress } from "./group-list-address";
import { mentorStudentAddress } from "./mentor-list-address";
import {
  openMemberAddresses,
  openMentorStudentAddresses,
} from "./open-member-address";

const GROUP_ID = "00000000-0000-4000-8000-000000000001";
const STUDENT_ID = "00000000-0000-4000-8000-000000000002";
const MENTOR_ID = "00000000-0000-4000-8000-000000000003";

describe("openMemberAddresses", () => {
  it.each(["head_of_unit", "director", "head_of_program"] as const)(
    "gives %s the address of a member's detail over the group's page",
    (role) => {
      const addressOf = openMemberAddresses([role], GROUP_ID);

      expect(addressOf?.(STUDENT_ID)).toBe(
        groupMemberAddress(GROUP_ID, STUDENT_ID),
      );
    },
  );

  it("keeps the page of the members shown", () => {
    const addressOf = openMemberAddresses(["head_of_unit"], GROUP_ID, 2);

    expect(addressOf?.(STUDENT_ID)).toBe(
      groupMemberAddress(GROUP_ID, STUDENT_ID, 2),
    );
  });

  it("gives Pegawai UPK none, so a member is no link", () => {
    expect(openMemberAddresses(["upk_staff"], GROUP_ID)).toBeNull();
  });
});

describe("openMentorStudentAddresses", () => {
  it.each(["head_of_unit", "director", "head_of_program"] as const)(
    "gives %s the address of a student's detail over the mentor's page",
    (role) => {
      const addressOf = openMentorStudentAddresses([role], MENTOR_ID);

      expect(addressOf?.(STUDENT_ID)).toBe(
        mentorStudentAddress(MENTOR_ID, STUDENT_ID),
      );
    },
  );

  it("keeps the page of the students shown", () => {
    const addressOf = openMentorStudentAddresses(
      ["head_of_unit"],
      MENTOR_ID,
      3,
    );

    expect(addressOf?.(STUDENT_ID)).toBe(
      mentorStudentAddress(MENTOR_ID, STUDENT_ID, 3),
    );
  });

  it("gives Pegawai UPK none, so a student is no link", () => {
    expect(openMentorStudentAddresses(["upk_staff"], MENTOR_ID)).toBeNull();
  });
});
