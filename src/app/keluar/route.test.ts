import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionCookieName } from "@/auth/session-token";
import { sessionAccount, startSession } from "@/auth/sessions";
import { addTestAccount } from "@/auth/test-records";
import type { Database } from "@/db/connect";
import { sessions, signInLog } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { currentStage } from "@/settings";
import { POST } from "./route";

interface SetCookie {
  name: string;
  value: string;
  options: unknown;
}

/** Stands in for the browser's cookies and for the app's database. */
const request = vi.hoisted(() => ({
  sent: new Map<string, string>(),
  set: [] as SetCookie[],
  db: null as Database | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      const value = request.sent.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string, options: unknown) {
      request.set.push({ name, value, options });
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
const NOW = new Date();
const COOKIE = sessionCookieName(currentStage());

beforeEach(() => {
  request.sent.clear();
  request.set.length = 0;
  request.db = null;
});

function expectSignInPage(answer: Response): void {
  expect(answer.status).toBe(303);
  expect(answer.headers.get("Location")).toBe("/masuk");
  expect(answer.headers.get("Cache-Control")).toBe("no-store");
}

describe("Keluar", () => {
  it("ends the session, clears its cookie and opens the sign-in page anew", async () => {
    await inTestDatabase(async (db) => {
      request.db = db;
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
      });
      const token = await startSession(db, accountId, NOW);
      request.sent.set(COOKIE, token);

      const answer = await POST();

      expectSignInPage(answer);
      expect(await db.select().from(sessions)).toEqual([]);
      expect(await sessionAccount(db, token, NOW)).toBeNull();
      expect(request.set).toEqual([
        {
          name: COOKIE,
          value: "",
          options: {
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            path: "/",
            maxAge: 0,
          },
        },
      ]);
      const lines = await db.select().from(signInLog);
      expect(lines.map((line) => line.result)).toEqual([
        "signed_in",
        "signed_out",
      ]);
    });
  });

  it("leaves another person's session alone", async () => {
    await inTestDatabase(async (db) => {
      request.db = db;
      const budi = await addTestAccount(db, { email: "budi@kampus.example" });
      const siti = await addTestAccount(db, { email: "siti@kampus.example" });
      const mine = await startSession(db, budi, NOW);
      const hers = await startSession(db, siti, NOW);
      request.sent.set(COOKIE, mine);

      await POST();

      expect((await sessionAccount(db, hers, NOW))?.id).toBe(siti);
    });
  });

  it("opens the sign-in page for someone who was not signed in, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      request.db = db;

      const answer = await POST();

      expectSignInPage(answer);
      expect(request.set).toEqual([]);
      expect(await db.select().from(signInLog)).toEqual([]);
    });
  });
});
