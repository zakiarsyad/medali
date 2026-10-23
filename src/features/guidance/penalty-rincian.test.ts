import { describe, expect, it, vi } from "vitest";
import type { OpenedPenalty } from "./penalty-detail-read";
import type { PenaltyFollowUp } from "./penalty-follow-up";
import { askRincian, laterFollowUp, withFollowUp } from "./penalty-rincian";

const PENALTY: OpenedPenalty = {
  id: "p1",
  name: "Mega Saragih",
  description: "Terlambat mengikuti apel pagi tiga kali dalam satu bulan.",
  category: "heavy",
  level: 1,
  status: "imposed",
  decisionNumber: "KEP-009/PKN/2026",
  socialWorkForms: [],
  socialWorkOther: "",
  socialWorkPlace: null,
  socialWorkStartsOn: null,
  socialWorkEndsOn: null,
  savedByName: "Agus Hermawan",
  semester: 3,
  conditionsMet: [],
  decision: "pending",
  version: 2,
  hasAgency: true,
};

describe("askRincian", () => {
  it("asks the penalty and its counselling of the one penalty opened", async () => {
    const penalty = vi.fn(async () => PENALTY);
    const counselling = vi.fn(async () => "KONSELING");

    const loaded = await askRincian({ penalty, counselling }, "p1");

    expect(penalty).toHaveBeenCalledWith("p1");
    expect(counselling).toHaveBeenCalledWith("p1");
    expect(loaded).toEqual({ penalty: PENALTY, counselling: "KONSELING" });
  });

  it("gives no counselling to an account that does not send to it", async () => {
    const loaded = await askRincian({ penalty: async () => PENALTY }, "p1");

    expect(loaded).toEqual({ penalty: PENALTY, counselling: null });
  });

  it("gives nothing when the server gives no penalty", async () => {
    const loaded = await askRincian(
      { penalty: async () => null, counselling: async () => "KONSELING" },
      "p1",
    );

    expect(loaded).toBeNull();
  });

  it("fails when the server cannot answer", async () => {
    const failing = askRincian(
      {
        penalty: async () => {
          throw new Error("offline");
        },
      },
      "p1",
    );

    await expect(failing).rejects.toThrow("offline");
  });
});

describe("withFollowUp", () => {
  it("puts what a follow-up gave back into the loaded penalty", () => {
    const next: PenaltyFollowUp = {
      status: "serving",
      conditionsMet: ["served", "academic"],
      decision: "pending",
      version: 3,
    };

    const loaded = withFollowUp({ penalty: PENALTY, counselling: null }, next);

    expect(loaded.penalty).toEqual({ ...PENALTY, ...next });
    expect(loaded.counselling).toBeNull();
  });
});

describe("laterFollowUp", () => {
  it("keeps the status and version of the later of the two", () => {
    const shown = { status: "served", version: 4 } as const;

    expect(laterFollowUp(shown, PENALTY)).toBe(shown);
    expect(laterFollowUp({ status: "imposed", version: 1 }, PENALTY)).toEqual({
      status: "imposed",
      version: 2,
    });
  });
});
