// Sample Tahun akademik of this file: 7351 to 7353.
import { describe, expect, it, vi } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { surveyResultFixings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestSurveyAnswer,
  addTestSurveyPeriod,
} from "@/mentoring/test-survey-periods";
import { fixSurveyResultsAction } from "./survey-actions";
import { readGroupSurveyDetail } from "./survey-group-detail";
import { readSurveyGroupRows } from "./survey-group-reads";
import { readResultPeriods } from "./survey-result-periods";
import { surveyResultRowsFor, surveyRightsFor } from "./survey-rights";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";

const signedIn = vi.hoisted(() => ({
  db: null as Database | null,
  account: null as AccountForAccess | null,
}));

vi.mock("@/auth/current-account", () => ({
  currentAccount: async () => signedIn.account,
}));
vi.mock("@/db/database", () => ({ database: () => signedIn.db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  forbidden: () => {
    throw new Error("Refused: forbidden.");
  },
}));

const inTestDatabase = withTestDatabase();

const TODAY = "7352-11-01";
const SUGGESTION = "Saran rahasia uji yang tidak boleh terkirim.";

/**
 * A closed survey period with a group whose three members answered and
 * one more group whose two members answered, each with a suggestion.
 */
async function addRecords(db: Database) {
  const periods = await addTestPeriods(db, 7351);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Tolak");
  const surveyId = await addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: "7352-10-01",
    endsOn: "7352-10-20",
    closedBy: head.id,
    closedAt: new Date("7352-10-21T03:00:00Z"),
  });
  const program = await addTestProgram(db, "UJITOLAKHASIL");
  const groups = [];
  for (const [place, answers] of [3, 2].entries()) {
    const groupId = await addTestGroup(db, program, { number: place + 1 });
    const mentorId = await addTestMentor(db, {
      name: `Pengasuh Tolak ${place}`,
    });
    await addTestMentorLine(db, groupId, mentorId);
    const members = await addTestMembersWithStatus(
      db,
      { id: groupId, studyProgramId: program },
      9900735301 + place * 10,
      ["active", "active", "active"],
    );
    for (const studentId of members.slice(0, answers)) {
      await addTestSurveyAnswer(db, {
        surveyPeriodId: surveyId,
        groupId,
        mentorId,
        studentId,
        suggestion: `${SUGGESTION} ${place}`,
      });
    }
    groups.push({ groupId, mentorId, members });
  }
  return { head, surveyId, program, groups };
}

function formOf(surveyPeriodId: string): FormData {
  const form = new FormData();
  form.set("surveyPeriodId", surveyPeriodId);
  return form;
}

describe("Tetapkan hasil evaluasi sent by hand", () => {
  it.each<RoleId>([
    "director",
    "head_of_program",
    "upk_staff",
    "mentor",
    "student",
  ])(
    "is refused for %s before anything is read, and nothing is fixed",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { surveyId } = await addRecords(db);
        const other = await addTestEvaluator(db, [role], "Akun Uji Tolak");
        signedIn.db = db;
        signedIn.account = other;

        await expect(fixSurveyResultsAction(formOf(surveyId))).rejects.toThrow(
          "forbidden",
        );
        expect(await db.select().from(surveyResultFixings)).toEqual([]);
      });
    },
  );

  it("is refused without a signed-in account", async () => {
    signedIn.account = null;

    await expect(fixSurveyResultsAction(formOf("x"))).rejects.toThrow(
      "forbidden",
    );
  });

  it("fixes for Kepala Unit and says how many groups got a line", async () => {
    await inTestDatabase(async (db) => {
      const { head, surveyId } = await addRecords(db);
      signedIn.db = db;
      signedIn.account = head;

      const said = await fixSurveyResultsAction(formOf(surveyId));

      // Nobody is assessed, so no group has a Nilai evaluasi to keep.
      expect(said).toEqual({
        error: null,
        done: "Hasil evaluasi 0 kelompok ditetapkan.",
      });
      expect(await db.select().from(surveyResultFixings)).toHaveLength(1);
    });
  });
});

describe("what the server sends of the answers", () => {
  it("sends no student, no time of an answer and no single score in the rows or the detail of any reading role", async () => {
    await inTestDatabase(async (db) => {
      const { surveyId, program, groups } = await addRecords(db);
      const periods = await readResultPeriods(db, TODAY);
      const period = periods.find((one) => one.id === surveyId);
      if (!period) throw new Error("The period was not read.");
      for (const role of ["head_of_unit", "director", "upk_staff"] as const) {
        const reader = await addTestEvaluator(db, [role], "Pembaca Uji");
        const limit = surveyResultRowsFor({
          ...reader,
          studyProgramId: program,
        });
        if (limit === null) throw new Error("The reader reads nothing.");
        const rows = await readSurveyGroupRows(db, limit, period);
        const details = await Promise.all(
          groups.map((group) =>
            readGroupSurveyDetail(db, limit, surveyId, group),
          ),
        );
        const sent = JSON.stringify({ rows, details });

        for (const group of groups) {
          for (const studentId of group.members) {
            expect(sent).not.toContain(studentId);
          }
        }
        expect(sent).not.toContain("sentAt");
        expect(sent).not.toContain("scores");
        expect(sent).toContain(`${SUGGESTION} 0`);
        expect(sent).not.toContain(`${SUGGESTION} 1`);
      }
    });
  });
});

describe("the tab for Pengasuh and Mahasiswa", () => {
  it.each<RoleId>(["mentor", "student"])(
    "gives %s no results and no fixing",
    (role) => {
      const account = {
        id: "akun",
        roles: [role],
        studyProgramId: null,
        studentId: null,
      };

      expect(surveyRightsFor(account)).toMatchObject({
        results: null,
        mayFix: false,
        mayManage: false,
      });
    },
  );
});
