import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { daysBefore } from "@/academic-periods/days-before";
import type { Database } from "./connect";
import { academicPeriods, accounts, studentSurveyPeriods } from "./schema";
import { withTestDatabase } from "./test-database";
import { brokeUniqueRule } from "./unique-violation";

const inTestDatabase = withTestDatabase();

/*
 * The database decides by its own clock whether a period still runs, so
 * these days are counted from the real day on campus.
 */
const TODAY = campusDay();
const AT = new Date();

interface Records {
  periodId: string;
  openerId: string;
  otherId: string;
}

async function addAccount(db: Database, name: string): Promise<string> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

async function addRecords(db: Database): Promise<Records> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 2101,
      term: "odd",
      startsOn: "2101-08-01",
      endsOn: "2102-01-31",
    })
    .returning();
  if (!period) throw new Error("The period was not added.");
  return {
    periodId: period.id,
    openerId: await addAccount(db, "Akun Uji Pembuka Survei"),
    otherId: await addAccount(db, "Akun Uji Penutup Survei"),
  };
}

type NewSurveyPeriod = Partial<typeof studentSurveyPeriods.$inferInsert>;

/** A survey period that is open today, unless `more` says otherwise. */
function addSurveyPeriod(
  db: Database,
  of: Records,
  more: NewSurveyPeriod = {},
) {
  return db
    .insert(studentSurveyPeriods)
    .values({
      periodId: of.periodId,
      startsOn: TODAY,
      endsOn: daysAfter(TODAY, 14),
      achievementWeight: 50,
      openedBy: of.openerId,
      openedAt: AT,
      ...more,
    })
    .returning();
}

const ENDED = {
  startsOn: daysBefore(TODAY, 20),
  endsOn: daysBefore(TODAY, 1),
};

describe("a student survey period", () => {
  it("is refused while another one is open, and the refusal names the rule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSurveyPeriod(db, records);

      const refusal = await addSurveyPeriod(db, records, {
        startsOn: daysAfter(TODAY, 30),
        endsOn: daysAfter(TODAY, 44),
      }).then(
        () => null,
        (error: unknown) => error,
      );

      expect(refusal).not.toBe(null);
      expect(
        brokeUniqueRule(refusal, "student_survey_periods_one_running"),
      ).toBe(true);
    });
  });

  it("is refused while another one waits for its first day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSurveyPeriod(db, records, {
        startsOn: daysAfter(TODAY, 30),
        endsOn: daysAfter(TODAY, 44),
      });

      await expect(addSurveyPeriod(db, records)).rejects.toThrow();
    });
  });

  it("is refused while another one is on its last day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSurveyPeriod(db, records, {
        startsOn: daysBefore(TODAY, 14),
        endsOn: TODAY,
      });

      await expect(addSurveyPeriod(db, records)).rejects.toThrow();
    });
  });

  it("is taken beside one that is past its last day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSurveyPeriod(db, records, ENDED);

      const [second] = await addSurveyPeriod(db, records);

      expect(second).toMatchObject({ startsOn: TODAY });
    });
  });

  it("is taken beside one that was closed by hand", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSurveyPeriod(db, records, {
        closedAt: AT,
        closedBy: records.otherId,
      });

      const [second] = await addSurveyPeriod(db, records);

      expect(second).toMatchObject({ startsOn: TODAY });
    });
  });

  it("is taken beside one that was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSurveyPeriod(db, records, {
        cancelledAt: AT,
        cancelledBy: records.otherId,
      });

      const [second] = await addSurveyPeriod(db, records);

      expect(second).toMatchObject({ startsOn: TODAY });
    });
  });

  it("cannot get a later last day once it is over and another one runs", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [ended] = await addSurveyPeriod(db, records, ENDED);
      await addSurveyPeriod(db, records);

      await expect(
        db
          .update(studentSurveyPeriods)
          .set({ endsOn: daysAfter(TODAY, 3) })
          .where(eq(studentSurveyPeriods.id, ended?.id ?? "")),
      ).rejects.toThrow();
    });
  });

  it("can get another last day while it is the only one that runs", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [open] = await addSurveyPeriod(db, records);

      const [changed] = await db
        .update(studentSurveyPeriods)
        .set({ endsOn: daysAfter(TODAY, 21) })
        .where(eq(studentSurveyPeriods.id, open?.id ?? ""))
        .returning();

      expect(changed).toMatchObject({ endsOn: daysAfter(TODAY, 21) });
    });
  });

  it("is refused a last day before its first day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSurveyPeriod(db, records, { endsOn: daysBefore(TODAY, 1) }),
      ).rejects.toThrow();
    });
  });

  it("is taken for one day only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [oneDay] = await addSurveyPeriod(db, records, { endsOn: TODAY });

      expect(oneDay).toMatchObject({ startsOn: TODAY, endsOn: TODAY });
    });
  });

  it.each([-1, 101])("is refused the weight %i", async (weight) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSurveyPeriod(db, records, { achievementWeight: weight }),
      ).rejects.toThrow();
    });
  });

  it.each([0, 100])("is taken with the weight %i", async (weight) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [added] = await addSurveyPeriod(db, records, {
        achievementWeight: weight,
      });

      expect(added).toMatchObject({ achievementWeight: weight });
    });
  });

  it("is refused when closed without who", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSurveyPeriod(db, records, { closedAt: AT }),
      ).rejects.toThrow();
    });
  });

  it("is refused when cancelled without when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSurveyPeriod(db, records, { cancelledBy: records.otherId }),
      ).rejects.toThrow();
    });
  });

  it("is refused when both closed and cancelled", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSurveyPeriod(db, records, {
          closedAt: AT,
          closedBy: records.otherId,
          cancelledAt: AT,
          cancelledBy: records.otherId,
        }),
      ).rejects.toThrow();
    });
  });

  it("can be cancelled, and then keeps who and when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [open] = await addSurveyPeriod(db, records);

      const [cancelled] = await db
        .update(studentSurveyPeriods)
        .set({ cancelledAt: AT, cancelledBy: records.otherId })
        .where(eq(studentSurveyPeriods.id, open?.id ?? ""))
        .returning();

      expect(cancelled).toMatchObject({
        cancelledAt: AT,
        cancelledBy: records.otherId,
        openedBy: records.openerId,
      });
    });
  });

  it("cannot be deleted", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [open] = await addSurveyPeriod(db, records);

      await expect(
        db
          .delete(studentSurveyPeriods)
          .where(eq(studentSurveyPeriods.id, open?.id ?? "")),
      ).rejects.toThrow();
    });
  });
});
