import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { decideDormClarificationAction } from "./clarification-actions";
import { DECIDED_FIRST, REJECTION_NEEDS_NOTE } from "./clarification-decision";
import type { Decided } from "./leave-messages";

const answered = vi.hoisted(() => ({
  decided: null as Decided<unknown> | null,
  drawnAgain: [] as string[],
}));

const PENGELOLA: AccountForAccess = {
  id: "00000000-0000-4000-8000-000000000397",
  roles: ["dorm_manager"],
  studyProgramId: null,
  studentId: null,
};

vi.mock("next/cache", () => ({
  revalidatePath: (address: string) => answered.drawnAgain.push(address),
}));
vi.mock("@/auth/current-account", () => ({
  currentAccount: async () => PENGELOLA,
}));
vi.mock("@/db/database", () => ({ database: () => null }));
vi.mock("@/files/file-storage", () => ({ fileStorage: () => null }));
vi.mock("./decide-clarification", () => ({
  decideDormClarification: async () => answered.decided,
}));

beforeEach(() => {
  answered.drawnAgain = [];
});

describe("decideDormClarificationAction", () => {
  it("draws every page again once the decision is kept, so the card and the number beside Tugas saya follow", async () => {
    answered.decided = { ok: true, value: null };

    const answer = await decideDormClarificationAction("id", "leave", "");

    expect(answer.error).toBeNull();
    expect(answer.done).not.toBeNull();
    expect(answered.drawnAgain).toEqual(["/"]);
  });

  it("leaves the page as it was when another decided it first, so the card keeps the message", async () => {
    answered.decided = DECIDED_FIRST;

    expect(await decideDormClarificationAction("id", "leave", "")).toEqual({
      error: DECIDED_FIRST.error,
      done: null,
      stale: true,
    });
    expect(answered.drawnAgain).toEqual([]);
  });

  it("leaves the page as it was for any other refusal", async () => {
    answered.decided = REJECTION_NEEDS_NOTE;

    expect(await decideDormClarificationAction("id", "reject", "")).toEqual({
      error: REJECTION_NEEDS_NOTE.error,
      done: null,
      stale: false,
    });
    expect(answered.drawnAgain).toEqual([]);
  });
});
