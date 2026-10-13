import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestReplacement,
  testMentorLinesOf,
  testReplacementsOf,
} from "@/mentoring/test-replacements";
import {
  ALREADY_CANCELLED,
  ALREADY_IN_FORCE,
  cancelReplacement,
  NOT_ALLOWED_TO_CANCEL,
  REPLACEMENT_NOT_FOUND,
} from "./cancel-replacement";
import { addTestEvaluator, addTestHeldGroup } from "./test-evaluations";
import { addTestMentor, addTestMentorRole } from "./test-records";
import { readWaitingReplacementOf } from "./waiting-replacement-of";

const inTestDatabase = withTestDatabase();

/** A held group with a replacement that waits, and Kepala Unit. */
async function addWaiting(db: Database) {
  const group = await addTestHeldGroup(db, "UJIBATALGANTI", "Pengasuh Lama");
  const newMentorId = await addTestMentor(db, { name: "Pengasuh Uji Baru" });
  await addTestMentorRole(db, newMentorId);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Batal");
  const id = await addTestReplacement(db, {
    groupId: group.groupId,
    oldMentorId: group.mentorId,
    newMentorId,
    startsOn: "2086-11-02",
  });
  return { ...group, newMentorId, head, id };
}

describe("cancelReplacement", () => {
  it("marks a waiting replacement cancelled with who and when, erases nothing, and changes nothing for the group", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      const before = new Date();

      const cancelled = await cancelReplacement(db, made.head, made.id);

      expect(cancelled).toEqual({ ok: true, value: null });
      const [stored, ...others] = await testReplacementsOf(db, made.groupId);
      expect(others).toEqual([]);
      expect(stored).toMatchObject({
        id: made.id,
        cancelledBy: made.head.id,
        carriedOutAt: null,
      });
      expect(stored?.cancelledAt?.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 1000,
      );
      expect(await testMentorLinesOf(db, made.groupId)).toEqual([
        expect.objectContaining({ mentorId: made.mentorId, endsOn: null }),
      ]);
      expect(await readWaitingReplacementOf(db, made.groupId)).toBeNull();
    });
  });

  it("is refused for every role but Kepala Unit, and the replacement still waits", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

      for (const role of others) {
        const actor = { ...made.head, roles: [role] };
        expect(await cancelReplacement(db, actor, made.id)).toEqual(
          NOT_ALLOWED_TO_CANCEL,
        );
      }

      const [stored] = await testReplacementsOf(db, made.groupId);
      expect(stored?.cancelledAt).toBeNull();
    });
  });

  it("refuses a second cancel, and keeps who cancelled first", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      const second = await addTestEvaluator(db, ["head_of_unit"], "Kepala Dua");
      await cancelReplacement(db, made.head, made.id);
      const [first] = await testReplacementsOf(db, made.groupId);

      const again = await cancelReplacement(db, second, made.id);

      expect(again).toEqual(ALREADY_CANCELLED);
      const [stored] = await testReplacementsOf(db, made.groupId);
      expect(stored?.cancelledBy).toBe(made.head.id);
      expect(stored?.cancelledAt).toEqual(first?.cancelledAt);
    });
  });

  it("refuses to cancel a replacement that is in force", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      const otherId = await addTestReplacement(db, {
        groupId: made.groupId,
        oldMentorId: made.mentorId,
        newMentorId: made.newMentorId,
        startsOn: "2086-01-05",
        carriedOutAt: new Date("2086-01-05T02:00:00Z"),
      });

      const cancelled = await cancelReplacement(db, made.head, otherId);

      expect(cancelled).toEqual(ALREADY_IN_FORCE);
      const stored = await testReplacementsOf(db, made.groupId);
      expect(stored.map((one) => one.cancelledAt)).toEqual([null, null]);
    });
  });

  it("refuses an id that names no replacement, or is no id", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);

      expect(await cancelReplacement(db, made.head, made.groupId)).toEqual(
        REPLACEMENT_NOT_FOUND,
      );
      expect(await cancelReplacement(db, made.head, "1 or 1=1")).toEqual(
        REPLACEMENT_NOT_FOUND,
      );
    });
  });
});

describe("readWaitingReplacementOf", () => {
  it("gives the replacement of a group that waits, with the mentor who is to take it", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);

      expect(await readWaitingReplacementOf(db, made.groupId)).toEqual({
        id: made.id,
        startsOn: "2086-11-02",
        newMentorName: "Pengasuh Uji Baru",
      });
    });
  });

  it("gives none for a group whose replacements are in force or cancelled", async () => {
    await inTestDatabase(async (db) => {
      const group = await addTestHeldGroup(
        db,
        "UJIBATALGANTI",
        "Pengasuh Lama",
      );
      const newMentorId = await addTestMentor(db, {
        name: "Pengasuh Uji Baru",
      });
      const replacement = {
        groupId: group.groupId,
        oldMentorId: group.mentorId,
        newMentorId,
      };
      await addTestReplacement(db, {
        ...replacement,
        carriedOutAt: new Date(),
      });
      await addTestReplacement(db, {
        ...replacement,
        cancelledBy: newMentorId,
        cancelledAt: new Date(),
      });

      expect(await readWaitingReplacementOf(db, group.groupId)).toBeNull();
    });
  });
});
