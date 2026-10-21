// Sample NIMs of this file: 9944290000 to 9944290099.

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  changePenaltyCondition,
  changePenaltyDecision,
  changePenaltyStatus,
} from "./follow-up-discipline-penalty";
import { CONTINUATION_CONDITIONS } from "./penalty-ids";
import {
  CONDITIONS_NOT_MET,
  NO_CONDITIONS,
  NOT_A_CONDITION,
  NOT_A_DECISION,
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

const SUSPENDED = {
  category: "heavy",
  level: 1,
  socialWorkEndsOn: "2027-06-11",
} as const;

/** A Berat jenjang pertama of a student, who has an Instansi asal unless told otherwise. */
async function suspension(
  db: Database,
  nim: string,
  hasAgency = true,
): Promise<Setting & { id: string }> {
  const found = await setting(db, nim);
  if (hasAgency) {
    await db
      .update(students)
      .set({ originAgency: "Instansi Uji" })
      .where(eq(students.id, found.studentId));
  }
  const id = await addTestPenalty(
    db,
    found.studentId,
    found.officer.id,
    DAY,
    SUSPENDED,
  );
  return { ...found, id };
}

describe("changePenaltyCondition", () => {
  it("ticks a condition and logs who, when, before and after", async () => {
    await inTestDatabase(async (db) => {
      const { officer, id } = await suspension(db, "9944290011");

      const answer = await changePenaltyCondition(
        db,
        officer,
        id,
        "academic",
        true,
      );

      expect(answer).toEqual({
        ok: true,
        value: {
          status: "imposed",
          conditionsMet: ["academic"],
          decision: "pending",
          version: 2,
        },
      });
      const lines = await penaltyLinesOf(db, id);
      expect(lines[1]).toEqual(
        expect.objectContaining({
          changedBy: officer.id,
          action: "conditions_changed",
          conditionsBefore: [],
          conditionsAfter: ["academic"],
          decisionBefore: "pending",
          decisionAfter: "pending",
        }),
      );
    });
  });

  it("puts Keputusan back to Menunggu pemenuhan syarat when a tick goes after Melanjutkan studi, and logs both", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentId } = await setting(db, "9944290012");
      await db
        .update(students)
        .set({ originAgency: "Instansi Uji" })
        .where(eq(students.id, studentId));
      const id = await addTestPenalty(db, studentId, officer.id, DAY, {
        ...SUSPENDED,
        conditionsMet: [...CONTINUATION_CONDITIONS],
        decision: "continue",
      });

      const answer = await changePenaltyCondition(
        db,
        officer,
        id,
        "character",
        false,
      );

      expect(answer.ok && answer.value.decision).toBe("pending");
      expect((await penaltyAt(db, id))?.decision).toBe("pending");
      const lines = await penaltyLinesOf(db, id);
      expect(lines[1]).toEqual(
        expect.objectContaining({
          action: "conditions_changed",
          decisionBefore: "continue",
          decisionAfter: "pending",
        }),
      );
    });
  });

  it("refuses a student without an Instansi asal", async () => {
    await inTestDatabase(async (db) => {
      const { officer, id } = await suspension(db, "9944290013", false);

      const answer = await changePenaltyCondition(
        db,
        officer,
        id,
        "academic",
        true,
      );

      expect(answer).toEqual(NO_CONDITIONS);
      expect(await penaltyLinesOf(db, id)).toHaveLength(1);
    });
  });

  it("refuses a condition that is not one of the five", async () => {
    await inTestDatabase(async (db) => {
      const { officer, id } = await suspension(db, "9944290014");

      expect(
        await changePenaltyCondition(db, officer, id, "lainnya", true),
      ).toEqual(NOT_A_CONDITION);
    });
  });

  it.each(["director", "head_of_program", "mentor"] as RoleId[])(
    "refuses a hand-made tick from %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { id } = await suspension(db, "9944290015");
        const reader = await addNoteActor(db, "Pembaca Uji", [role]);

        const answer = await changePenaltyCondition(
          db,
          reader,
          id,
          "academic",
          true,
        );

        expect(answer).toEqual(NOT_ALLOWED_TO_FOLLOW_UP);
        expect((await penaltyAt(db, id))?.conditionsMet).toEqual([]);
      });
    },
  );
});

describe("changePenaltyDecision", () => {
  it("records Melanjutkan studi once all five are ticked, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentId } = await setting(db, "9944290021");
      await db
        .update(students)
        .set({ originAgency: "Instansi Uji" })
        .where(eq(students.id, studentId));
      const id = await addTestPenalty(db, studentId, officer.id, DAY, {
        ...SUSPENDED,
        conditionsMet: [...CONTINUATION_CONDITIONS],
      });

      const answer = await changePenaltyDecision(db, officer, id, "continue");

      expect(answer.ok && answer.value.decision).toBe("continue");
      const lines = await penaltyLinesOf(db, id);
      expect(lines[1]).toEqual(
        expect.objectContaining({
          changedBy: officer.id,
          action: "decision_changed",
          decisionBefore: "pending",
          decisionAfter: "continue",
        }),
      );
    });
  });

  it("refuses Melanjutkan studi with a tick missing, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { officer, id } = await suspension(db, "9944290022");

      const answer = await changePenaltyDecision(db, officer, id, "continue");

      expect(answer).toEqual(CONDITIONS_NOT_MET);
      expect((await penaltyAt(db, id))?.decision).toBe("pending");
      expect(await penaltyLinesOf(db, id)).toHaveLength(1);
    });
  });

  it("refuses a penalty that is not Berat jenjang pertama", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentId } = await setting(db, "9944290023");
      const id = await addTestPenalty(db, studentId, officer.id, DAY);

      expect(await changePenaltyDecision(db, officer, id, "dismissed")).toEqual(
        NO_CONDITIONS,
      );
    });
  });

  it("refuses a Keputusan that is not one of the three", async () => {
    await inTestDatabase(async (db) => {
      const { officer, id } = await suspension(db, "9944290024");

      expect(await changePenaltyDecision(db, officer, id, "lulus")).toEqual(
        NOT_A_DECISION,
      );
    });
  });

  it("refuses a hand-made Keputusan from a reader", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await suspension(db, "9944290025");
      const reader = await addNoteActor(db, "Pembaca Uji", ["director"]);

      expect(await changePenaltyDecision(db, reader, id, "dismissed")).toEqual(
        NOT_ALLOWED_TO_FOLLOW_UP,
      );
      expect((await penaltyAt(db, id))?.decision).toBe("pending");
    });
  });
});
