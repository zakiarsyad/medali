// Sample NIMs of this file: 9944290000 to 9944290099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { changePenaltyStatus } from "./follow-up-discipline-penalty";
import {
  NOT_A_FOLLOW_UP_STATUS,
  NOT_ALLOWED_TO_FOLLOW_UP,
  PENALTY_NOT_FOUND,
  STATUS_IS_SET,
} from "./penalty-messages";
import {
  addTestPenalty,
  NO_SOCIAL_WORK,
  penaltyAt,
  penaltyLinesOf,
} from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const DAY = "2026-10-12";

interface Setting {
  officer: AccountForAccess;
  studentId: string;
}

async function setting(db: Database, nim: string): Promise<Setting> {
  const officer = await addNoteActor(db, "Pembina Uji Tindak Lanjut", [
    "discipline_officer",
  ]);
  const { studentIds } = await addNoteStudents(
    db,
    `Prodi Uji Tindak Lanjut ${nim}`,
    "Mahasiswa Uji Tindak Lanjut",
    [nim],
  );
  return { officer, studentId: studentIds[0] ?? "" };
}

describe("changePenaltyStatus", () => {
  it.each([["discipline_officer"], ["head_of_unit"]] as const)(
    "lets %s move the status on, and logs who, when, before and after",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { officer, studentId } = await setting(db, "9944290001");
        const id = await addTestPenalty(db, studentId, officer.id, DAY);
        const actor = await addNoteActor(db, "Penindak Uji", [role]);

        const answer = await changePenaltyStatus(db, actor, id, "serving");

        const after = {
          status: "serving",
          conditionsMet: [],
          decision: "pending",
          version: 2,
        };
        expect(answer).toEqual({ ok: true, value: after });
        expect(await penaltyAt(db, id)).toEqual(expect.objectContaining(after));
        const lines = await penaltyLinesOf(db, id);
        expect(lines).toHaveLength(2);
        expect(lines[1]).toEqual(
          expect.objectContaining({
            changedBy: actor.id,
            action: "status_changed",
            statusBefore: "imposed",
            statusAfter: "serving",
            conditionsBefore: [],
            conditionsAfter: [],
            decisionBefore: "pending",
            decisionAfter: "pending",
          }),
        );
        expect(lines[1]?.changedAt).toBeInstanceOf(Date);
      });
    },
  );

  it("lets the status go back from Selesai dijalani", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentId } = await setting(db, "9944290002");
      const id = await addTestPenalty(db, studentId, officer.id, DAY, {
        status: "served",
      });

      const answer = await changePenaltyStatus(db, officer, id, "serving");

      expect(answer.ok).toBe(true);
      expect((await penaltyAt(db, id))?.status).toBe("serving");
    });
  });

  it("writes nothing when the status chosen is the one it has", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentId } = await setting(db, "9944290003");
      const id = await addTestPenalty(db, studentId, officer.id, DAY);

      const answer = await changePenaltyStatus(db, officer, id, "imposed");

      expect(answer).toEqual(
        expect.objectContaining({
          ok: true,
          value: expect.objectContaining({ version: 1 }),
        }),
      );
      expect(await penaltyLinesOf(db, id)).toHaveLength(1);
    });
  });

  it.each(["director", "head_of_program", "mentor", "student"] as RoleId[])(
    "refuses a hand-made change from %s, and changes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { officer, studentId } = await setting(db, "9944290004");
        const id = await addTestPenalty(db, studentId, officer.id, DAY);
        const reader = await addNoteActor(db, "Pembaca Uji", [role]);

        const answer = await changePenaltyStatus(db, reader, id, "served");

        expect(answer).toEqual(NOT_ALLOWED_TO_FOLLOW_UP);
        expect((await penaltyAt(db, id))?.status).toBe("imposed");
        expect(await penaltyLinesOf(db, id)).toHaveLength(1);
      });
    },
  );

  it("refuses a change of a Ditetapkan penalty", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentId } = await setting(db, "9944290005");
      const id = await addTestPenalty(db, studentId, officer.id, DAY, {
        category: "heavy",
        level: 2,
        status: "set",
        ...NO_SOCIAL_WORK,
      });

      const answer = await changePenaltyStatus(db, officer, id, "served");

      expect(answer).toEqual(STATUS_IS_SET);
      expect((await penaltyAt(db, id))?.status).toBe("set");
      expect(await penaltyLinesOf(db, id)).toHaveLength(1);
    });
  });

  it.each(["set", "Selesai dijalani", ""])(
    "refuses the status %s",
    async (sent) => {
      await inTestDatabase(async (db) => {
        const { officer, studentId } = await setting(db, "9944290006");
        const id = await addTestPenalty(db, studentId, officer.id, DAY);

        const answer = await changePenaltyStatus(db, officer, id, sent);

        expect(answer).toEqual(NOT_A_FOLLOW_UP_STATUS);
      });
    },
  );

  it.each(["not-a-key", "00000000-0000-4000-8000-000000000000"])(
    "refuses a penalty that is not there: %s",
    async (id) => {
      await inTestDatabase(async (db) => {
        const { officer } = await setting(db, "9944290007");

        const answer = await changePenaltyStatus(db, officer, id, "served");

        expect(answer).toEqual(PENALTY_NOT_FOUND);
      });
    },
  );
});
