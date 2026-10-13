import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  mentorGroups,
  mentorReplacements,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const AT = new Date("2062-03-01T05:00:00Z");

interface Records {
  groupId: string;
  otherGroupId: string;
  oldMentorId: string;
  newMentorId: string;
  otherMentorId: string;
}

async function addAccount(db: Database, name: string): Promise<string> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

async function addGroup(
  db: Database,
  studyProgramId: number,
  number: number,
): Promise<string> {
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId,
      cohortYear: 2061,
      entryPath: "regular",
      number,
      startsOn: "2061-09-01",
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  return group.id;
}

async function addRecords(db: Database): Promise<Records> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Penggantian", code: "UJIGANTI" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return {
    groupId: await addGroup(db, program.id, 1),
    otherGroupId: await addGroup(db, program.id, 2),
    oldMentorId: await addAccount(db, "Akun Uji Pengasuh Lama"),
    newMentorId: await addAccount(db, "Akun Uji Pengasuh Baru"),
    otherMentorId: await addAccount(db, "Akun Uji Pengasuh Lain"),
  };
}

type NewReplacement = Partial<typeof mentorReplacements.$inferInsert>;

/** A replacement that waits for its day, unless `more` says otherwise. */
function addReplacement(db: Database, of: Records, more: NewReplacement = {}) {
  return db
    .insert(mentorReplacements)
    .values({
      groupId: of.groupId,
      oldMentorId: of.oldMentorId,
      newMentorId: of.newMentorId,
      startsOn: "2062-04-01",
      reason: "own_request",
      letterNumber: "ND-1/UJI/2062",
      oldMentorStatus: "reserve",
      setBy: of.oldMentorId,
      setAt: AT,
      ...more,
    })
    .returning();
}

describe("a mentor replacement", () => {
  it("is refused for a group that has one waiting already", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addReplacement(db, records);

      await expect(
        addReplacement(db, records, { newMentorId: records.otherMentorId }),
      ).rejects.toThrow();
    });
  });

  it("is refused when its new mentor is named in one that waits already", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addReplacement(db, records);

      await expect(
        addReplacement(db, records, { groupId: records.otherGroupId }),
      ).rejects.toThrow();
    });
  });

  it("is taken beside one of the same group and new mentor that was carried out", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addReplacement(db, records, { carriedOutAt: AT });

      const [second] = await addReplacement(db, records);

      expect(second).toMatchObject({ groupId: records.groupId });
    });
  });

  it("is taken beside one of the same group and new mentor that was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addReplacement(db, records, {
        cancelledAt: AT,
        cancelledBy: records.oldMentorId,
      });

      const [second] = await addReplacement(db, records);

      expect(second).toMatchObject({ groupId: records.groupId });
    });
  });

  it("is refused when cancelled without who", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addReplacement(db, records, { cancelledAt: AT }),
      ).rejects.toThrow();
    });
  });

  it("is refused when cancelled without when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addReplacement(db, records, { cancelledBy: records.oldMentorId }),
      ).rejects.toThrow();
    });
  });

  it("is refused when both carried out and cancelled", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addReplacement(db, records, {
          carriedOutAt: AT,
          cancelledAt: AT,
          cancelledBy: records.oldMentorId,
        }),
      ).rejects.toThrow();
    });
  });

  it("is refused when the new mentor is the old one", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addReplacement(db, records, { newMentorId: records.oldMentorId }),
      ).rejects.toThrow();
    });
  });

  it.each(["", "   "])("is refused the letter number '%s'", async (empty) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addReplacement(db, records, { letterNumber: empty }),
      ).rejects.toThrow();
    });
  });

  it("can be cancelled, and then keeps who and when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [waiting] = await addReplacement(db, records);

      const [cancelled] = await db
        .update(mentorReplacements)
        .set({ cancelledAt: AT, cancelledBy: records.otherMentorId })
        .where(eq(mentorReplacements.id, waiting?.id ?? ""))
        .returning();

      expect(cancelled).toMatchObject({
        cancelledAt: AT,
        cancelledBy: records.otherMentorId,
        carriedOutAt: null,
      });
    });
  });

  it("cannot be deleted", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [waiting] = await addReplacement(db, records);

      const removal = db
        .delete(mentorReplacements)
        .where(eq(mentorReplacements.id, waiting?.id ?? ""));

      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addReplacement(db, records);

      await expect(
        db.execute(sql`truncate mentor_replacements`),
      ).rejects.toThrow();
    });
  });
});
