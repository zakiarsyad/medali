import { describe, expect, it } from "vitest";
import { may } from "@/auth/access";
import { ROLE_IDS } from "@/auth/role-ids";
import { newMentorsAddress } from "./new-mentors-address";

const USERS = "/pengaturan/pengguna";

describe("newMentorsAddress", () => {
  it("gives Kepala Unit the address of Pengguna dan peran", () => {
    expect(newMentorsAddress(["head_of_unit"], USERS)).toBe(USERS);
  });

  it.each(["director", "head_of_program", "upk_staff"] as const)(
    "gives %s none, who sees the mentors but adds no account",
    (role) => {
      expect(newMentorsAddress([role], USERS)).toBeNull();
    },
  );

  it("gives it to the roles that manage users, and to no other", () => {
    for (const role of ROLE_IDS) {
      const given = newMentorsAddress([role], USERS) !== null;

      expect(given).toBe(may([role], "manage_users"));
    }
  });
});
