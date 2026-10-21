import { describe, expect, it } from "vitest";
import {
  type FollowedPenalty,
  type FollowUpValues,
  hasConditions,
  isFollowUpStatus,
  withCondition,
  withDecision,
  withStatus,
} from "./penalty-follow-up";
import { CONTINUATION_CONDITIONS } from "./penalty-ids";
import {
  CONDITIONS_NOT_MET,
  NO_CONDITIONS,
  STATUS_IS_SET,
} from "./penalty-messages";

const IMPOSED: FollowUpValues = {
  status: "imposed",
  conditionsMet: [],
  decision: "pending",
};

const SUSPENDED: FollowedPenalty = {
  ...IMPOSED,
  category: "heavy",
  level: 1,
  hasAgency: true,
};

const ALL_MET: FollowedPenalty = {
  ...SUSPENDED,
  conditionsMet: [...CONTINUATION_CONDITIONS],
};

describe("isFollowUpStatus", () => {
  it.each(["imposed", "serving", "served"])("takes %s", (sent) => {
    expect(isFollowUpStatus(sent)).toBe(true);
  });

  it.each(["set", "", "Selesai dijalani", "done"])(
    "refuses %s, which no follow-up chooses",
    (sent) => {
      expect(isFollowUpStatus(sent)).toBe(false);
    },
  );
});

describe("withStatus", () => {
  it("moves Dijatuhkan on to Sedang dijalani, keeping the conditions and Keputusan", () => {
    const before = { ...IMPOSED, conditionsMet: ["academic" as const] };
    expect(withStatus(before, "serving")).toEqual({
      ok: true,
      value: { ...before, status: "serving" },
    });
  });

  it("lets Selesai dijalani go back to Sedang dijalani", () => {
    expect(withStatus({ ...IMPOSED, status: "served" }, "serving")).toEqual({
      ok: true,
      value: { ...IMPOSED, status: "serving" },
    });
  });

  it("refuses to change a Ditetapkan penalty", () => {
    expect(withStatus({ ...IMPOSED, status: "set" }, "served")).toEqual(
      STATUS_IS_SET,
    );
  });
});

describe("hasConditions", () => {
  it("holds for Berat jenjang pertama of a student with an Instansi asal", () => {
    expect(hasConditions(SUSPENDED)).toBe(true);
  });

  it.each([
    ["no Instansi asal", { ...SUSPENDED, hasAgency: false }],
    ["Berat jenjang kedua", { ...SUSPENDED, level: 2 as const }],
    ["Sedang jenjang pertama", { ...SUSPENDED, category: "medium" as const }],
  ])("does not hold with %s", (_, penalty) => {
    expect(hasConditions(penalty)).toBe(false);
  });
});

describe("withCondition", () => {
  it("ticks a condition, keeping the fixed order", () => {
    const before = { ...SUSPENDED, conditionsMet: ["study_leave" as const] };
    expect(withCondition(before, "served", true)).toEqual({
      ok: true,
      value: {
        ...IMPOSED,
        conditionsMet: ["served", "study_leave"],
      },
    });
  });

  it("takes a tick away, leaving a Keputusan other than Melanjutkan studi", () => {
    const before = { ...ALL_MET, decision: "dismissed" as const };
    expect(withCondition(before, "academic", false)).toEqual({
      ok: true,
      value: {
        ...IMPOSED,
        conditionsMet: ["served", "character", "recommendation", "study_leave"],
        decision: "dismissed",
      },
    });
  });

  it("puts Keputusan back to Menunggu pemenuhan syarat when a tick goes after Melanjutkan studi", () => {
    const before = { ...ALL_MET, decision: "continue" as const };
    const after = withCondition(before, "recommendation", false);
    expect(after.ok && after.value.decision).toBe("pending");
  });

  it("refuses a penalty that has no conditions", () => {
    expect(
      withCondition({ ...SUSPENDED, hasAgency: false }, "served", true),
    ).toEqual(NO_CONDITIONS);
  });

  it("refuses a Ditetapkan penalty", () => {
    expect(
      withCondition({ ...SUSPENDED, status: "set" }, "served", true),
    ).toEqual(STATUS_IS_SET);
  });
});

describe("withDecision", () => {
  it("records Melanjutkan studi once all five are ticked", () => {
    expect(withDecision(ALL_MET, "continue")).toEqual({
      ok: true,
      value: {
        ...IMPOSED,
        conditionsMet: [...CONTINUATION_CONDITIONS],
        decision: "continue",
      },
    });
  });

  it("refuses Melanjutkan studi with a tick missing", () => {
    const before = {
      ...SUSPENDED,
      conditionsMet: CONTINUATION_CONDITIONS.slice(0, 4),
    };
    expect(withDecision(before, "continue")).toEqual(CONDITIONS_NOT_MET);
  });

  it("records Diberhentikan dengan hormat whatever is ticked", () => {
    const after = withDecision(SUSPENDED, "dismissed");
    expect(after.ok && after.value.decision).toBe("dismissed");
  });

  it("refuses a penalty that has no conditions", () => {
    expect(withDecision({ ...SUSPENDED, level: 3 }, "dismissed")).toEqual(
      NO_CONDITIONS,
    );
  });

  it("refuses a Ditetapkan penalty", () => {
    expect(withDecision({ ...ALL_MET, status: "set" }, "continue")).toEqual(
      STATUS_IS_SET,
    );
  });
});
