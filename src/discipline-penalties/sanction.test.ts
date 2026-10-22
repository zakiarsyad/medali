import { describe, expect, it } from "vitest";
import { type HeavyPenalty, SANCTION_WORDS, sanctionOf } from "./sanction";

function heavy(more: Partial<HeavyPenalty> = {}): HeavyPenalty {
  return { level: 1, status: "imposed", decision: "pending", ...more };
}

describe("sanctionOf", () => {
  it("gives no badge to a student without a Berat penalty", () => {
    expect(sanctionOf([], false)).toBeNull();
  });

  it.each([2, 3] as const)(
    "gives Diberhentikan permanen for Berat jenjang %i, whatever its status",
    (level) => {
      const set = heavy({ level, status: "set" });

      expect(sanctionOf([set], false)).toBe("dismissed");
      expect(sanctionOf([set], true)).toBe("dismissed");
    },
  );

  it("gives Diberhentikan (ayat 8) when the Keputusan is Diberhentikan dengan hormat (ayat 8)", () => {
    expect(
      sanctionOf([heavy({ status: "served", decision: "dismissed" })], true),
    ).toBe("dismissed_ayat_8");
  });

  it("gives no badge when the Keputusan is Melanjutkan studi", () => {
    expect(
      sanctionOf([heavy({ status: "served", decision: "continue" })], true),
    ).toBeNull();
  });

  it.each(["imposed", "serving"] as const)(
    "gives Diberhentikan sementara while the penalty is %s",
    (status) => {
      expect(sanctionOf([heavy({ status })], false)).toBe("suspended");
      expect(sanctionOf([heavy({ status })], true)).toBe("suspended");
    },
  );

  it("ends Diberhentikan sementara once Selesai dijalani for a student without an Instansi asal", () => {
    expect(sanctionOf([heavy({ status: "served" })], false)).toBeNull();
  });

  it("keeps Diberhentikan sementara after Selesai dijalani for a student with an Instansi asal, until a Keputusan", () => {
    expect(sanctionOf([heavy({ status: "served" })], true)).toBe("suspended");
  });

  it("goes by the highest Jenjang of the student's Berat penalties", () => {
    const served = heavy({ status: "served", decision: "continue" });
    const dismissed = heavy({ level: 2, status: "set" });

    expect(sanctionOf([served, dismissed], false)).toBe("dismissed");
  });

  it("goes by the latest of two as high, the first given", () => {
    const latest = heavy({ status: "serving" });
    const older = heavy({ status: "served", decision: "continue" });

    expect(sanctionOf([latest, older], true)).toBe("suspended");
    expect(sanctionOf([older, latest], true)).toBeNull();
  });

  it("names each badge as the prototype does", () => {
    expect(SANCTION_WORDS).toEqual({
      suspended: "Diberhentikan sementara",
      dismissed: "Diberhentikan permanen",
      dismissed_ayat_8: "Diberhentikan (ayat 8)",
    });
  });
});
