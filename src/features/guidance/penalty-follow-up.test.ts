import { describe, expect, it } from "vitest";
import {
  type FollowUpValues,
  isFollowUpStatus,
  withStatus,
} from "./penalty-follow-up";
import { STATUS_IS_SET } from "./penalty-messages";

const IMPOSED: FollowUpValues = {
  status: "imposed",
  conditionsMet: [],
  decision: "pending",
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
