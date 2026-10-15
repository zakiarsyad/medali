// Sample NIMs of this file: 9986200300 to 9986200399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  fitnessScores,
  fitnessTests,
  mentorGroups,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readGroupMembers } from "./fitness-groups";
import {
  DAY_IN_FUTURE,
  NO_SCORE,
  NO_TEST_DAY,
  SCORE_NOT_WHOLE,
} from "./fitness-input";
import {
  NOT_ALLOWED_TO_ENTER,
  NOT_GROUP_MEMBERS,
  SCORES_ALREADY_SENT,
  saveFitnessScores,
} from "./save-fitness-scores";
import { addTestActor, addTestGroup, addTestStudents } from "./test-fitness";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

/** A group of Ani, Budi and Citra, and another of Dodi. */
async function addGroups(db: Database) {
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Simpan Jasmani",
    ["9986200301", "9986200302", "9986200303", "9986200304"],
  );
  const [ani = "", budi = "", citra = "", dodi = ""] = studentIds;
  const groupId = await addTestGroup(db, programId, [ani, budi, citra]);
  const otherGroupId = await addTestGroup(db, programId, [dodi], {
    number: 2,
  });
  const penilai = await addTestActor(db, "Penilai Uji Jasmani", ["assessor"]);
  return { groupId, otherGroupId, penilai, ids: { ani, budi, citra, dodi } };
}

async function keptScores(db: Database) {
  return db
    .select({
      studentId: fitnessScores.studentId,
      score: fitnessScores.score,
      testedOn: fitnessTests.testedOn,
      groupId: fitnessTests.groupId,
      enteredBy: fitnessTests.enteredBy,
    })
    .from(fitnessScores)
    .innerJoin(fitnessTests, eq(fitnessTests.id, fitnessScores.testId));
}

describe("saveFitnessScores", () => {
  it("keeps the filled scores of the group, skips the empty ones, and gives how many", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, penilai, ids } = await addGroups(db);

      const saved = await saveFitnessScores(
        db,
        penilai,
        crypto.randomUUID(),
        {
          groupId,
          testedOn: "2026-10-16",
          rows: [
            { studentId: ids.ani, typed: "88" },
            { studentId: ids.budi, typed: "" },
            { studentId: ids.citra, typed: "54" },
          ],
        },
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: 2 });
      const kept = await keptScores(db);
      expect(kept).toHaveLength(2);
      expect(kept).toEqual(
        expect.arrayContaining([
          {
            studentId: ids.ani,
            score: 88,
            testedOn: "2026-10-16",
            groupId,
            enteredBy: penilai.id,
          },
          expect.objectContaining({ studentId: ids.citra, score: 54 }),
        ]),
      );
      const members = await readGroupMembers(db, penilai, groupId);
      expect(members.map((member) => member.latestScore)).toEqual([
        88,
        null,
        54,
      ]);
    });
  });

  it("lets Kepala Unit save too", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, ids } = await addGroups(db);
      const kepala = await addTestActor(db, "Kepala Uji Jasmani", [
        "head_of_unit",
      ]);

      expect(
        await saveFitnessScores(
          db,
          kepala,
          crypto.randomUUID(),
          {
            groupId,
            testedOn: "2026-10-01",
            rows: [{ studentId: ids.ani, typed: "70" }],
          },
          MOMENT,
        ),
      ).toEqual({ ok: true, value: 1 });
    });
  });

  it.each<RoleId>([
    "director",
    "head_of_program",
    "mentor",
    "counsellor",
    "student",
  ])("refuses %s and keeps nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { groupId, ids } = await addGroups(db);
      const actor = await addTestActor(db, "Bukan Penilai Uji", [role]);

      expect(
        await saveFitnessScores(
          db,
          actor,
          crypto.randomUUID(),
          {
            groupId,
            testedOn: "2026-10-16",
            rows: [{ studentId: ids.ani, typed: "80" }],
          },
          MOMENT,
        ),
      ).toEqual(NOT_ALLOWED_TO_ENTER);
      expect(await keptScores(db)).toEqual([]);
    });
  });

  it.each<[string, string, string, string]>([
    ["a score above 100", "2026-10-16", "101", SCORE_NOT_WHOLE],
    ["a score that is not whole", "2026-10-16", "72.5", SCORE_NOT_WHOLE],
    ["a test day after today", "2026-10-17", "80", DAY_IN_FUTURE],
    ["no test day", "", "80", NO_TEST_DAY],
  ])(
    "keeps nothing for %s, not even the good score beside it",
    async (_, testedOn, typed, error) => {
      await inTestDatabase(async (db) => {
        const { groupId, penilai, ids } = await addGroups(db);

        expect(
          await saveFitnessScores(
            db,
            penilai,
            crypto.randomUUID(),
            {
              groupId,
              testedOn,
              rows: [
                { studentId: ids.ani, typed: "80" },
                { studentId: ids.budi, typed },
              ],
            },
            MOMENT,
          ),
        ).toEqual({ ok: false, error });
        expect(await keptScores(db)).toEqual([]);
      });
    },
  );

  it("asks for at least one score", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, penilai, ids } = await addGroups(db);

      expect(
        await saveFitnessScores(
          db,
          penilai,
          crypto.randomUUID(),
          {
            groupId,
            testedOn: "2026-10-16",
            rows: [{ studentId: ids.ani, typed: " " }],
          },
          MOMENT,
        ),
      ).toEqual({ ok: false, error: NO_SCORE });
    });
  });

  it("refuses a student who is no Aktif member of the chosen group in force, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, otherGroupId, penilai, ids } = await addGroups(db);
      const save = (groupFor: string, studentId: string) =>
        saveFitnessScores(
          db,
          penilai,
          crypto.randomUUID(),
          {
            groupId: groupFor,
            testedOn: "2026-10-16",
            rows: [
              { studentId: ids.ani, typed: "80" },
              { studentId, typed: "70" },
            ],
          },
          MOMENT,
        );

      expect(await save(groupId, ids.dodi)).toEqual(NOT_GROUP_MEMBERS);
      expect(await save(groupId, ids.ani)).toEqual(NOT_GROUP_MEMBERS);
      expect(await save(otherGroupId, ids.dodi)).toEqual(NOT_GROUP_MEMBERS);
      expect(await save("bukan-kunci", ids.budi)).toEqual(NOT_GROUP_MEMBERS);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, ids.budi));
      expect(await save(groupId, ids.budi)).toEqual(NOT_GROUP_MEMBERS);
      await db
        .update(mentorGroups)
        .set({ endedAt: MOMENT, endedBy: penilai.id })
        .where(eq(mentorGroups.id, groupId));
      expect(await save(groupId, ids.citra)).toEqual(NOT_GROUP_MEMBERS);
      expect(await keptScores(db)).toEqual([]);
    });
  });

  it("counts the save made last, even when its test day is earlier, and keeps the one before as history", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, penilai, ids } = await addGroups(db);
      const saveOn = (testedOn: string, typed: string, moment: Date) =>
        saveFitnessScores(
          db,
          penilai,
          crypto.randomUUID(),
          { groupId, testedOn, rows: [{ studentId: ids.ani, typed }] },
          moment,
        );

      await saveOn("2026-10-10", "40", MOMENT);
      await saveOn("2026-10-01", "75", new Date("2026-10-16T04:00:00Z"));

      const [ani] = await readGroupMembers(db, penilai, groupId);
      expect(ani?.latestScore).toBe(75);
      expect(await keptScores(db)).toHaveLength(2);
    });
  });

  it("keeps a form sent twice once, and refuses a key it did not just use", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, penilai, ids } = await addGroups(db);
      const id = crypto.randomUUID();
      const sent = {
        groupId,
        testedOn: "2026-10-16",
        rows: [{ studentId: ids.ani, typed: "80" }],
      };

      const first = await saveFitnessScores(db, penilai, id, sent, MOMENT);
      const again = await saveFitnessScores(db, penilai, id, sent, MOMENT);
      const changed = await saveFitnessScores(
        db,
        penilai,
        id,
        { ...sent, rows: [{ studentId: ids.ani, typed: "81" }] },
        MOMENT,
      );

      expect(first).toEqual({ ok: true, value: 1 });
      expect(again).toEqual(first);
      expect(changed).toEqual(SCORES_ALREADY_SENT);
      expect(
        await saveFitnessScores(db, penilai, "bukan-kunci", sent, MOMENT),
      ).toEqual(SCORES_ALREADY_SENT);
      expect(await keptScores(db)).toHaveLength(1);
    });
  });
});
