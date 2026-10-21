// Sample NIMs of this file: 9986332000 to 9986332099.
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { changeSession } from "./change-session";
import { openStudentSessions } from "./counselling-list-detail";
import { addTestActor } from "./test-consents";
import { addConsentedPeople, TEST_SESSION } from "./test-sessions";
import { writeSession } from "./write-session";

/*
 * A change still under way and a reading beside it need two connections
 * that both see the saved rows. So these checks have a database of their
 * own, dropped at the end.
 */
const own = withOwnTestDatabase("counselling_list");

// 10:00 on campus on Selasa 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

// 10:00 on campus on Rabu 21 October 2026.
const LATER = new Date("2026-10-21T03:00:00Z");

function notesOf(
  opened: Awaited<ReturnType<typeof openStudentSessions>>,
): string[] {
  if (!opened.ok) throw new Error(opened.error);
  return opened.value.items.map((item) => item.notes);
}

describe("Rincian opened while a colleague changes a session", () => {
  it("shows the saved version while the change is part-way, and the change on the next load", async () => {
    const people = await addConsentedPeople(
      own.db,
      "Prodi Uji Rincian Sekaligus",
      ["9986332001"],
    );
    const [studentId] = people.studentIds;
    if (!studentId) throw new Error("The student was not added.");
    const id = randomUUID();
    await writeSession(
      own.db,
      people.counsellor,
      { id, studentId },
      TEST_SESSION,
      NOW,
    );
    const colleague = await addTestActor(own.db, "Konselor Uji Rekan", [
      "counsellor",
    ]);
    const changed = { ...TEST_SESSION, notes: "Perubahan rekan." };

    const during = await own.db.transaction(async (tx) => {
      const outcome = await changeSession(
        tx,
        colleague,
        id,
        NOW.toISOString(),
        changed,
        LATER,
      );
      expect(outcome.kind).toBe("kept");
      return openStudentSessions(
        own.otherDb,
        people.counsellor,
        studentId,
        1,
        LATER,
      );
    });
    const next = await openStudentSessions(
      own.db,
      people.counsellor,
      studentId,
      1,
      LATER,
    );

    expect(notesOf(during)).toEqual([TEST_SESSION.notes]);
    expect(notesOf(next)).toEqual(["Perubahan rekan."]);
  });
});
