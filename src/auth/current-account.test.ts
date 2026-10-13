import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestGroupToReplace,
  addTestReplacement,
  testMentorLinesOf,
  testReplacementsOf,
} from "@/mentoring/test-replacements";
import { currentStage } from "@/settings";
import { currentAccount } from "./current-account";
import { sessionCookieName } from "./session-token";
import { startSession } from "./sessions";
import { addTestAccount } from "./test-records";

/** Stands in for the browser's cookies and for the app's database. */
const request = vi.hoisted(() => ({
  sent: new Map<string, string>(),
  db: null as Database | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      const value = request.sent.get(name);
      return value === undefined ? undefined : { name, value };
    },
  }),
}));

vi.mock("@/db/database", () => ({
  database() {
    if (!request.db) throw new Error("The check gave no database.");
    return request.db;
  },
}));

const inTestDatabase = withTestDatabase();
const COOKIE = sessionCookieName(currentStage());
/** A start date that has come on whatever day the check runs. */
const STARTED_ON = "2026-10-01";

beforeEach(() => {
  request.sent.clear();
  request.db = null;
});

describe("currentAccount", () => {
  it("gives a group its new mentor before it answers, once the start date of a Terjadwal replacement has come", async () => {
    await inTestDatabase(async (db) => {
      request.db = db;
      const made = await addTestGroupToReplace(db, "UJIMASUKGANTI");
      await addTestReplacement(db, { ...made, startsOn: STARTED_ON });
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
      });
      request.sent.set(COOKIE, await startSession(db, accountId, new Date()));

      const account = await currentAccount();

      expect(account?.id).toBe(accountId);
      const [replacement] = await testReplacementsOf(db, made.groupId);
      expect(replacement?.carriedOutAt).toBeInstanceOf(Date);
      const lines = await testMentorLinesOf(db, made.groupId);
      expect(lines.map((line) => [line.mentorId, line.endsOn])).toEqual([
        [made.oldMentorId, STARTED_ON],
        [made.newMentorId, null],
      ]);
    });
  });
});
