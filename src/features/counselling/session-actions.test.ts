import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { ChangeOutcome } from "./change-session";
import { changeSessionAction, writeSessionAction } from "./session-actions";
import type { SessionOutcome } from "./write-session";

const answered = vi.hoisted(() => ({
  written: null as SessionOutcome | null,
  changed: null as ChangeOutcome | null,
  drawnAgain: [] as string[],
}));

const COUNSELLOR: AccountForAccess = {
  id: "00000000-0000-4000-8000-0000005e0323",
  roles: ["counsellor"],
  studyProgramId: null,
  studentId: null,
};

vi.mock("next/cache", () => ({
  revalidatePath: (address: string) => answered.drawnAgain.push(address),
}));
vi.mock("@/auth/current-account", () => ({
  currentAccount: async () => COUNSELLOR,
}));
vi.mock("@/db/database", () => ({ database: () => null }));
vi.mock("./write-session", () => ({
  writeSession: async () => answered.written,
}));
vi.mock("./change-session", () => ({
  changeSession: async () => answered.changed,
}));

beforeEach(() => {
  answered.drawnAgain = [];
});

describe("writeSessionAction", () => {
  it("draws Konseling again once the session is kept, so its numbers and panels follow", async () => {
    answered.written = { kind: "kept", done: "Sesi konseling dicatat." };

    expect(await writeSessionAction(new FormData())).toEqual(answered.written);
    expect(answered.drawnAgain).toEqual(["/konseling"]);
  });

  it("leaves Konseling as it was when the session is refused", async () => {
    answered.written = { kind: "refused", error: "Ditolak." };

    expect(await writeSessionAction(new FormData())).toEqual(answered.written);
    expect(answered.drawnAgain).toEqual([]);
  });
});

describe("changeSessionAction", () => {
  it("draws Konseling again once the change is kept", async () => {
    answered.changed = { kind: "kept", done: "Catatan sesi diperbarui." };

    expect(await changeSessionAction("id", "version", new FormData())).toEqual(
      answered.changed,
    );
    expect(answered.drawnAgain).toEqual(["/konseling"]);
  });

  it.each([
    { kind: "refused", error: "Ditolak." },
    { kind: "changed", error: "Sesi sudah diubah." },
  ] as const)(
    "leaves Konseling as it was when nothing is kept: $kind",
    async (outcome) => {
      answered.changed = outcome;

      expect(
        await changeSessionAction("id", "version", new FormData()),
      ).toEqual(outcome);
      expect(answered.drawnAgain).toEqual([]);
    },
  );
});
