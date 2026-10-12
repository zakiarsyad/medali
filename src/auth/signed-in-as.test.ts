import { describe, expect, it } from "vitest";
import type { Account } from "./accounts";
import { signedInAs } from "./signed-in-as";

const account: Account = {
  id: "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10",
  name: "Budi Contoh",
  title: "S.E.",
  unit: null,
  roles: ["mentor", "assessor"],
  studyProgramId: null,
  studentId: null,
  studentProgram: null,
};

describe("signedInAs", () => {
  it("shows the name and the roles of the account", () => {
    const shown = signedInAs({ account, way: "google" }, false);

    expect(shown.name).toBe("Budi Contoh, S.E.");
    expect(shown.roles).toBe("Pengasuh, Penilai Mahasiswa");
  });

  it("offers Keluar only to someone signed in with Google", () => {
    expect(signedInAs({ account, way: "google" }, true).maySignOut).toBe(true);
    expect(signedInAs({ account, way: "switcher" }, true).maySignOut).toBe(
      false,
    );
  });

  it("offers Ganti peran only where it is on", () => {
    expect(signedInAs({ account, way: "google" }, true).maySwitch).toBe(true);
    expect(signedInAs({ account, way: "google" }, false).maySwitch).toBe(false);
  });
});
