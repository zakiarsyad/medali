import { describe, expect, it } from "vitest";
import { parseBamRoles } from "./bam-role-input";

const ACCOUNT = "3f2b8c1e-5a4d-4e6f-9a7b-1c2d3e4f5a6b";

describe("parseBamRoles", () => {
  it("takes a student's account with one or more BAM roles, each once", () => {
    expect(
      parseBamRoles({
        accountId: ACCOUNT,
        roles: ["bam_health", "bam_bphk", "bam_health"],
      }),
    ).toEqual({
      ok: true,
      value: { accountId: ACCOUNT, roles: ["bam_health", "bam_bphk"] },
    });
  });

  it.each(["", "bukan-id"])("asks for a student when given '%s'", (id) => {
    expect(parseBamRoles({ accountId: id, roles: ["bam_bphk"] })).toEqual({
      ok: false,
      error: "Pilih mahasiswa terlebih dahulu.",
    });
  });

  it("asks for a role when none is ticked", () => {
    expect(parseBamRoles({ accountId: ACCOUNT, roles: [] })).toEqual({
      ok: false,
      error: "Pilih minimal satu peran.",
    });
  });

  it.each(["mentor", "student", "head_of_unit", "dorm_manager", "bam_unknown"])(
    "refuses %s, which is not a BAM role",
    (role) => {
      expect(
        parseBamRoles({ accountId: ACCOUNT, roles: ["bam_bphk", role] }),
      ).toEqual({ ok: false, error: "Peran tidak dikenal." });
    },
  );
});
