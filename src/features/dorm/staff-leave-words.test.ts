import { describe, expect, it, vi } from "vitest";
import { readLeaveListParams } from "./leave-address";
import { noLeaveWords } from "./staff-leave-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const START = readLeaveListParams({}).filters;

describe("noLeaveWords", () => {
  it("says nothing waits at the start, at Menunggu", () => {
    expect(noLeaveWords(START)).toBe("Tidak ada pengajuan yang menunggu.");
  });

  it("says there is none yet with every status and nothing else chosen", () => {
    expect(noLeaveWords({ ...START, status: "all" })).toBe(
      "Belum ada pengajuan izin.",
    );
  });

  it.each([
    { query: "nama lain" },
    { status: "all", kind: "outing" },
    { status: "rejected" },
  ] as const)("says nothing matches for %j", (chosen) => {
    expect(noLeaveWords({ ...START, ...chosen })).toBe(
      "Tidak ada pengajuan pada filter ini.",
    );
  });
});
