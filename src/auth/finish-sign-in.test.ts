import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { sessions, signInLog } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { pagesFor } from "./access";
import {
  type AddressConfirmer,
  type CodeExchange,
  finishSignIn,
  type ReturnFromGoogle,
} from "./finish-sign-in";
import type { ConfirmedAddress } from "./google-token";
import { sessionAccount } from "./sessions";
import { newSignInAttempt } from "./sign-in-attempt";
import { addTestAccount, addTestStudentAccount } from "./test-records";

const inTestDatabase = withTestDatabase();
const NOW = new Date("2026-10-12T08:00:00Z");
const ENDING = "@kampus.example";
const RETURN_ADDRESS = "https://medali.example/masuk/google/kembali";

/** Stands in for Google: it answers every code with one fixed answer. */
function googleSaying(answer: ConfirmedAddress | null) {
  const asked: CodeExchange[] = [];
  const google: AddressConfirmer = {
    async confirmAddress(exchange) {
      asked.push(exchange);
      return answer;
    },
  };
  return { google, asked };
}

function backFromGoogle(): ReturnFromGoogle {
  return {
    code: "kode-uji",
    attempt: newSignInAttempt(),
    returnAddress: RETURN_ADDRESS,
  };
}

function finish(
  db: Database,
  answer: ConfirmedAddress | null,
  back: ReturnFromGoogle = backFromGoogle(),
) {
  const setup = { google: googleSaying(answer).google, campusEnding: ENDING };
  return finishSignIn(db, setup, back, NOW);
}

function logLines(db: Database) {
  return db
    .select({
      result: signInLog.result,
      accountId: signInLog.accountId,
      happenedAt: signInLog.happenedAt,
    })
    .from(signInLog);
}

describe("finishSignIn", () => {
  it("signs in the account that holds the confirmed campus address", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
        roles: ["mentor", "assessor"],
      });

      const finished = await finish(db, {
        email: "budi@kampus.example",
        verified: true,
        hostedDomain: "kampus.example",
      });

      if (finished.result !== "signed_in") throw new Error(finished.result);
      const account = await sessionAccount(db, finished.sessionToken, NOW);
      expect(account?.id).toBe(accountId);
      expect(account?.roles).toEqual(["mentor", "assessor"]);
      expect(await logLines(db)).toEqual([
        { result: "signed_in", accountId, happenedAt: NOW },
      ]);
    });
  });

  it("signs in the student whose account holds the confirmed address, and Profil saya is their first page", async () => {
    await inTestDatabase(async (db) => {
      const email = "mahasiswa.uji@kampus.example";
      const accountId = await addTestStudentAccount(db, {
        nim: "9900002711",
        email,
      });

      const finished = await finish(db, {
        email,
        verified: true,
        hostedDomain: "kampus.example",
      });

      if (finished.result !== "signed_in") throw new Error(finished.result);
      const account = await sessionAccount(db, finished.sessionToken, NOW);
      expect(account?.id).toBe(accountId);
      expect(account?.studentId).not.toBeNull();
      expect(pagesFor(account?.roles ?? [])[0]?.id).toBe("profile");
    });
  });

  it("refuses a student whose account holds no address, as it refuses an unknown address", async () => {
    await inTestDatabase(async (db) => {
      await addTestStudentAccount(db, { nim: "9900002712", email: null });
      const answer = { verified: true, hostedDomain: "kampus.example" };

      const student = await finish(db, {
        ...answer,
        email: "tanpa.alamat@kampus.example",
      });
      const unknown = await finish(db, {
        ...answer,
        email: "tamu@kampus.example",
      });

      expect(student).toEqual({ result: "refused_no_account" });
      expect(student).toEqual(unknown);
      expect(await db.select().from(sessions)).toEqual([]);
    });
  });

  it("gives Google the code with the verifier and nonce of the attempt", async () => {
    await inTestDatabase(async (db) => {
      const { google, asked } = googleSaying(null);
      const back = backFromGoogle();

      await finishSignIn(db, { google, campusEnding: ENDING }, back, NOW);

      expect(asked).toEqual([
        {
          code: "kode-uji",
          verifier: back.attempt?.verifier,
          nonce: back.attempt?.nonce,
          returnAddress: RETURN_ADDRESS,
        },
      ]);
    });
  });

  it.each([
    [
      "an address outside the campus",
      {
        email: "orang@luar.example",
        verified: true,
        hostedDomain: "kampus.example",
      },
      "refused_outside_campus",
    ],
    [
      "a campus address Google has not verified",
      {
        email: "budi@kampus.example",
        verified: false,
        hostedDomain: "kampus.example",
      },
      "refused_outside_campus",
    ],
    [
      "a campus address on a personal Google account",
      { email: "budi@kampus.example", verified: true, hostedDomain: null },
      "refused_outside_campus",
    ],
    [
      "a campus address that has no account",
      {
        email: "tamu@kampus.example",
        verified: true,
        hostedDomain: "kampus.example",
      },
      "refused_no_account",
    ],
    [
      "a campus address whose account was removed",
      {
        email: "lama@kampus.example",
        verified: true,
        hostedDomain: "kampus.example",
      },
      "refused_no_account",
    ],
  ] as const)(
    "refuses %s, signs nobody in, and logs it without naming anyone",
    async (_kind, answer, result) => {
      await inTestDatabase(async (db) => {
        await addTestAccount(db, { email: "budi@kampus.example" });
        await addTestAccount(db, { email: "orang@luar.example" });
        await addTestAccount(db, {
          email: "lama@kampus.example",
          deletedAt: NOW,
        });

        expect(await finish(db, answer)).toEqual({ result });
        expect(await db.select().from(sessions)).toEqual([]);
        expect(await logLines(db)).toEqual([
          { result, accountId: null, happenedAt: NOW },
        ]);
      });
    },
  );

  it.each([
    ["no code, as when the person cancels at Google", { code: null }],
    ["no attempt kept for the state", { attempt: null }],
    ["no address to come back to", { returnAddress: null }],
  ])(
    "fails without asking Google or writing a log line when there is %s",
    async (_kind, missing) => {
      await inTestDatabase(async (db) => {
        const { google, asked } = googleSaying({
          email: "budi@kampus.example",
          verified: true,
          hostedDomain: "kampus.example",
        });
        await addTestAccount(db, { email: "budi@kampus.example" });
        const back = { ...backFromGoogle(), ...missing };

        const finished = await finishSignIn(
          db,
          { google, campusEnding: ENDING },
          back,
          NOW,
        );

        expect(finished).toEqual({ result: "failed" });
        expect(asked).toEqual([]);
        expect(await logLines(db)).toEqual([]);
        expect(await db.select().from(sessions)).toEqual([]);
      });
    },
  );

  it("writes no log line for a hand-made return with a made-up attempt cookie and no code", async () => {
    await inTestDatabase(async (db) => {
      // What anyone can send: a state and a cookie of the right shape,
      // both made up, and nothing from Google.
      const forged = {
        code: null,
        attempt: newSignInAttempt(),
        returnAddress: RETURN_ADDRESS,
      };

      const finished = await finishSignIn(
        db,
        { google: googleSaying(null).google, campusEnding: ENDING },
        forged,
        NOW,
      );

      expect(finished).toEqual({ result: "failed" });
      expect(await logLines(db)).toEqual([]);
    });
  });

  it("writes no log line when Google gives no answer that can be trusted, as for a made-up code", async () => {
    await inTestDatabase(async (db) => {
      await addTestAccount(db, { email: "budi@kampus.example" });

      expect(await finish(db, null)).toEqual({ result: "failed" });
      expect(await logLines(db)).toEqual([]);
      expect(await db.select().from(sessions)).toEqual([]);
    });
  });

  it("fails while Google sign-in is not set up, and writes no log line", async () => {
    await inTestDatabase(async (db) => {
      expect(await finishSignIn(db, null, backFromGoogle(), NOW)).toEqual({
        result: "failed",
      });
      expect(await logLines(db)).toEqual([]);
    });
  });

  it("refuses every address while the campus ending is empty", async () => {
    await inTestDatabase(async (db) => {
      await addTestAccount(db, { email: "budi@kampus.example" });
      const { google } = googleSaying({
        email: "budi@kampus.example",
        verified: true,
        hostedDomain: "kampus.example",
      });

      const finished = await finishSignIn(
        db,
        { google, campusEnding: "" },
        backFromGoogle(),
        NOW,
      );

      expect(finished).toEqual({ result: "refused_outside_campus" });
    });
  });

  it("gives two sign-ins of one person a working session each", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
      });
      const answer = {
        email: "budi@kampus.example",
        verified: true,
        hostedDomain: "kampus.example",
      };

      const first = await finish(db, answer);
      const second = await finish(db, answer);

      if (first.result !== "signed_in") throw new Error(first.result);
      if (second.result !== "signed_in") throw new Error(second.result);
      expect(first.sessionToken).not.toBe(second.sessionToken);
      expect((await sessionAccount(db, first.sessionToken, NOW))?.id).toBe(
        accountId,
      );
      expect((await sessionAccount(db, second.sessionToken, NOW))?.id).toBe(
        accountId,
      );
    });
  });
});
