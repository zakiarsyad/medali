import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { STARTING_SCHEME } from "@/features/character-grades/scheme-ids";
import type { Database } from "./connect";
import { accounts, characterGradeSchemes } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Setting = typeof characterGradeSchemes.$inferInsert;

async function addAccount(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Kepala Uji Tabel Skema" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

function setting(setBy: string, more: Partial<Setting> = {}): Setting {
  return {
    attendanceWeight: 40,
    mentoringWeight: 20,
    sikuWeight: 20,
    skpmWeight: 20,
    aFrom: 85,
    bFrom: 70,
    cFrom: 60,
    dFrom: 50,
    passLetter: "B",
    before: STARTING_SCHEME,
    replaces: null,
    setBy,
    setAt: new Date(),
    ...more,
  };
}

async function addSetting(db: Database, value: Setting): Promise<string> {
  const [added] = await db
    .insert(characterGradeSchemes)
    .values(value)
    .returning();
  if (!added) throw new Error("The setting was not added.");
  return added.id;
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("a setting of the character grade scheme", () => {
  it("keeps a scheme whose weights total 100 and whose limits go down, a weight of 0 among them", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);

      await expect(
        addSetting(
          db,
          setting(setBy, { attendanceWeight: 0, mentoringWeight: 60 }),
        ),
      ).resolves.toEqual(expect.any(String));
    });
  });

  it.each<[string, Partial<Setting>]>([
    ["weights that total 99", { attendanceWeight: 39 }],
    ["weights that total 101", { attendanceWeight: 41 }],
    ["a weight below 0", { attendanceWeight: -1, mentoringWeight: 61 }],
    ["a limit above 100", { aFrom: 101 }],
    ["a limit below 0", { dFrom: -1 }],
    ["B as high as A", { bFrom: 85 }],
    ["D above C", { dFrom: 61 }],
  ])("is refused with %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);

      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(setBy, more))),
      ).rejects.toThrow();
    });
  });

  it("replaces another setting at most once, the starting scheme among them", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);
      const first = await addSetting(db, setting(setBy));

      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(setBy))),
      ).rejects.toThrow();
      await addSetting(db, setting(setBy, { replaces: first }));
      await expect(
        inOwnStep(db, (tx) =>
          addSetting(tx, setting(setBy, { replaces: first })),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);
      const id = await addSetting(db, setting(setBy));

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(characterGradeSchemes)
            .set({ passLetter: "A" })
            .where(eq(characterGradeSchemes.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx
            .delete(characterGradeSchemes)
            .where(eq(characterGradeSchemes.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate character_grade_schemes`),
      ).rejects.toThrow();
    });
  });
});
