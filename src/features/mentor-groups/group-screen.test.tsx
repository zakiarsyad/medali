import { describe, expect, it, vi } from "vitest";
import { GroupScreen } from "./group-screen";

vi.mock("@/db/database", () => ({ database: () => ({}) }));
vi.mock("@/academic-periods/stored-periods", () => ({
  readRunningPeriod: async () => null,
}));
vi.mock("./group-page", () => ({
  readGroupPage: async () => ({ kind: "not_found" }),
}));
vi.mock("next/navigation", () => ({
  forbidden: () => {
    throw new Error("forbidden");
  },
  notFound: () => {
    throw new Error("not found");
  },
}));

describe("the page of a group the address names that is not found", () => {
  it("shows what the page gives for it, and the page still opens", async () => {
    const instead = <p>Kelompok tidak ditemukan</p>;

    const shown = await GroupScreen({
      limit: { kind: "all" },
      evaluationLimit: null,
      evaluateAddress: null,
      replaceAddress: null,
      groupId: "bukan-id",
      memberPage: 1,
      detailVisible: null,
      memberAddressOf: null,
      mentorAddressOf: () => null,
      whenNotFound: instead,
    });

    expect(shown).toBe(instead);
  });
});
