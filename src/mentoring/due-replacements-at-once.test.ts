import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { carryOutDueReplacements } from "./due-replacements";
import {
  addTestGroupToReplace,
  addTestReplacement,
  testMentorLinesOf,
  testReplacementsOf,
} from "./test-replacements";

/*
 * A replacement is never erased, so no rows are removed after the check:
 * the database is dropped at the end.
 */
const own = withOwnTestDatabase("jatuhtempo");

const STARTS_ON = "2085-03-10";

describe("two requests on the day a replacement starts", () => {
  it("carry it out once: the second waits, then finds nothing left to do", async () => {
    const made = await addTestGroupToReplace(own.db, "UJIJATUHTEMPODUA");
    await addTestReplacement(own.db, { ...made, startsOn: STARTS_ON });

    await own.atOnce(
      (db) => carryOutDueReplacements(db, STARTS_ON),
      (db) => carryOutDueReplacements(db, STARTS_ON),
    );

    const [replacement] = await testReplacementsOf(own.db, made.groupId);
    expect(replacement?.carriedOutAt).toBeInstanceOf(Date);
    expect(await testMentorLinesOf(own.db, made.groupId)).toEqual([
      expect.objectContaining({
        mentorId: made.oldMentorId,
        endsOn: STARTS_ON,
      }),
      expect.objectContaining({
        mentorId: made.newMentorId,
        startsOn: STARTS_ON,
        endsOn: null,
      }),
    ]);
  });
});
