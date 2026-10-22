// Sample NIMs of this file: 9944420000 to 9944420099. None is added to
// the database.
import { describe, expect, it } from "vitest";
import { startChange } from "./asked-start";
import type { PenaltyStart } from "./penalty-student";

const A = "00000000-0000-4000-8000-000000000801";
const B = "00000000-0000-4000-8000-000000000802";

function startOn(id: string, nim: string): PenaltyStart {
  return {
    pick: {
      id,
      name: "Mahasiswa Uji Pilihan Formulir",
      nim,
      program: "Prodi Uji Pilihan Formulir",
      hasAgency: false,
      cohortYear: 2025,
    },
    history: { count: 0, top: null, latest: null },
  };
}

describe("startChange", () => {
  it("takes the student Catat pelanggaran asks for when the form took none before", () => {
    const b = startOn(B, "9944420002");

    expect(startChange(b, null)).toEqual({ take: b, remember: B });
  });

  it("takes another student asked for over the one taken before", () => {
    const b = startOn(B, "9944420002");

    expect(startChange(b, A)).toEqual({ take: b, remember: B });
  });

  // A name, a filter, a page or Tutup leaves the student out of the
  // address: what was picked and typed must stay.
  it("takes nothing and forgets the last student when the address no longer asks for one", () => {
    expect(startChange(null, A)).toEqual({ take: null, remember: null });
  });

  // After a save the address still asks for the same student: the
  // cleared form must not pick them again.
  it("takes nothing again for the student it already took", () => {
    expect(startChange(startOn(A, "9944420001"), A)).toEqual({
      take: null,
      remember: A,
    });
  });

  it("takes a student again once the address left them out and asks for them anew", () => {
    const a = startOn(A, "9944420001");
    const left = startChange(null, A);

    expect(startChange(a, left.remember)).toEqual({ take: a, remember: A });
  });
});
