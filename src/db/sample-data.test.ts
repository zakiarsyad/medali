import { describe, expect, it } from "vitest";
import { pagesFor } from "@/auth/access";
import { SAMPLE_ACCOUNTS } from "./sample-data";

describe("the sample account with two roles", () => {
  it("shows more pages than either of its roles alone", () => {
    const twoRoles = SAMPLE_ACCOUNTS.filter((a) => a.roles.length === 2);
    expect(twoRoles).toHaveLength(1);
    const roles = twoRoles[0]?.roles ?? [];
    const together = pagesFor(roles).length;
    for (const role of roles) {
      expect(together).toBeGreaterThan(pagesFor([role]).length);
    }
  });
});
