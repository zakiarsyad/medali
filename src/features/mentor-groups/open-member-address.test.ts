import { describe, expect, it } from "vitest";
import { groupMemberAddress } from "./group-list-address";
import { openMemberAddresses } from "./open-member-address";

const GROUP_ID = "00000000-0000-4000-8000-000000000001";
const STUDENT_ID = "00000000-0000-4000-8000-000000000002";

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

  it("gives Pegawai UPK none, so a member is no link", () => {
    expect(openMemberAddresses(["upk_staff"], GROUP_ID)).toBeNull();
  });
});
