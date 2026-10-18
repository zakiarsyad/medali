import { describe, expect, it } from "vitest";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { dormOf, type ResidentFacts } from "@/dorms/resident-rule";
import {
  audiencesCovering,
  countAudience,
  covers,
  dormsOf,
} from "./activity-audience";

const RESIDENTS = {
  wismantara_putra: 3,
  wismantara_putri: 5,
  dana_rakca: 40,
  cipta_bakti: 20,
};

function resident(more: Partial<ResidentFacts>): ResidentFacts {
  return {
    status: "active",
    entryPath: "regular",
    sex: "female",
    isInternational: false,
    isSeedling: false,
    ...more,
  };
}

function dormIn(facts: Partial<ResidentFacts>): DormId {
  const dorm = dormOf(resident(facts), 1, null);
  if (dorm === null) throw new Error("The student lives in no dorm.");
  return dorm;
}

describe("dormsOf", () => {
  it("covers the four dorms for Semua penghuni", () => {
    expect(dormsOf("all")).toEqual(DORM_IDS);
  });

  it("covers one dorm for that dorm", () => {
    expect(dormsOf("dana_rakca")).toEqual(["dana_rakca"]);
  });

  it("puts each dorm with the men or with the women, never both", () => {
    for (const dorm of DORM_IDS) {
      expect(covers("men", dorm)).not.toBe(covers("women", dorm));
    }
  });
});

describe("covers", () => {
  it.each([
    [{ sex: "male" as const }, "men"],
    [{ sex: "male" as const, isInternational: true }, "men"],
    [{ sex: "female" as const }, "women"],
    [{ sex: "female" as const, isSeedling: true }, "women"],
  ] as const)(
    "puts the dorm a resident %j lives in with Penghuni %s",
    (facts, audience) => {
      const other = audience === "men" ? "women" : "men";

      expect(covers(audience, dormIn(facts))).toBe(true);
      expect(covers(other, dormIn(facts))).toBe(false);
    },
  );

  it("leaves the residents of another dorm out of an activity of one dorm", () => {
    expect(covers("dana_rakca", "dana_rakca")).toBe(true);
    expect(covers("dana_rakca", "wismantara_putri")).toBe(false);
    expect(covers("dana_rakca", "cipta_bakti")).toBe(false);
  });
});

describe("audiencesCovering", () => {
  it("gives a resident of Cipta Bakti the activities of all, of the men and of their dorm", () => {
    expect(audiencesCovering("cipta_bakti")).toEqual([
      "all",
      "men",
      "cipta_bakti",
    ]);
  });

  it("gives a resident of Wismantara Putri the activities of all, of the women and of their dorm", () => {
    expect(audiencesCovering("wismantara_putri")).toEqual([
      "all",
      "women",
      "wismantara_putri",
    ]);
  });
});

describe("countAudience", () => {
  it.each([
    ["all", 68],
    ["men", 23],
    ["women", 45],
    ["dana_rakca", 40],
  ] as const)("counts the residents of %s as %i", (audience, total) => {
    expect(countAudience(RESIDENTS, audience)).toBe(total);
  });
});
