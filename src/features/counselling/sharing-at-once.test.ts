// Sample NIMs of this file: 9986314000 to 9986314099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingSharings } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { SHARING_CHANGED } from "@/mental-health/sharing-words";
import { changeOwnConsent } from "./change-consent";
import { askSharing } from "./change-sharing";
import { readConsentOf } from "./consent-reads";
import { changeOwnSharing } from "./press-sharing";
import { changeSharingAsCounsellor } from "./publish-sharing";
import { readShownSharing } from "./sharing-reads";
import {
  ASKED_AT,
  addSharingStudent,
  askedSharing,
  TEST_ASK,
} from "./test-sharings";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("berbagi");

const ANSWERED_AT = new Date(ASKED_AT.getTime() + 60_000);
const MOMENT = new Date(ASKED_AT.getTime() + 120_000);

/** A student who approved a request, with what their page and the panel show. */
async function approvedStudent(program: string, nim: string) {
  const people = await addSharingStudent(own.db, program, nim);
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  const asked = await askedSharing(own.db, people);
  const approved = await changeOwnSharing(
    own.db,
    student,
    "approve",
    asked.id,
    asked.version,
    ANSWERED_AT,
  );
  if (approved.kind !== "kept" || approved.sharing === null) {
    throw new Error("Not approved.");
  }
  return { ...people, student, sharing: approved.sharing };
}

async function statusesOf(studentId: string) {
  const sharings = await own.db
    .select({ status: counsellingSharings.status })
    .from(counsellingSharings)
    .where(eq(counsellingSharings.studentId, studentId));
  return sharings.map((each) => each.status);
}

describe("the student withdraws while Konselor publishes", () => {
  it("withdraws a sharing published a moment before: the withdrawal wins and nothing is shown", async () => {
    const { counsellor, student, studentId, sharing } = await approvedStudent(
      "Prodi Uji Berbagi Sekaligus 1",
      "9986314001",
    );

    const both = await own.atOnce(
      (db) =>
        changeSharingAsCounsellor(
          db,
          counsellor,
          studentId,
          "publish",
          sharing.id,
          sharing.version,
          MOMENT,
        ),
      (db) =>
        changeOwnSharing(
          db,
          student,
          "withdraw",
          sharing.id,
          sharing.version,
          MOMENT,
        ),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      sharing: { status: "published" },
    });
    expect(both.later).toMatchObject({ kind: "kept", sharing: null });
    expect(await statusesOf(studentId)).toEqual(["withdrawn"]);
    expect(await readShownSharing(own.db, studentId)).toBeNull();
  });

  it("refuses to publish a sharing withdrawn a moment before: nothing is shown", async () => {
    const { counsellor, student, studentId, sharing } = await approvedStudent(
      "Prodi Uji Berbagi Sekaligus 2",
      "9986314002",
    );

    const both = await own.atOnce(
      (db) =>
        changeOwnSharing(
          db,
          student,
          "withdraw",
          sharing.id,
          sharing.version,
          MOMENT,
        ),
      (db) =>
        changeSharingAsCounsellor(
          db,
          counsellor,
          studentId,
          "publish",
          sharing.id,
          sharing.version,
          MOMENT,
        ),
    );

    expect(both.sooner).toMatchObject({ kind: "kept" });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: SHARING_CHANGED,
      sharing: { status: "withdrawn" },
    });
    expect(await statusesOf(studentId)).toEqual(["withdrawn"]);
    expect(await readShownSharing(own.db, studentId)).toBeNull();
  });
});

describe("the student withdraws their consent to counselling while Konselor publishes", () => {
  it("refuses to publish: the sharing is Dicabut and nothing is shown", async () => {
    const { counsellor, student, studentId, sharing } = await approvedStudent(
      "Prodi Uji Berbagi Sekaligus 3",
      "9986314003",
    );
    const consent = await readConsentOf(own.db, studentId);

    // Only the kind of each outcome is compared, as the two differ in shape.
    const both = await own.atOnce(
      async (db) =>
        (
          await changeOwnConsent(
            db,
            student,
            "withdraw",
            consent?.version,
            MOMENT,
          )
        ).kind,
      async (db) =>
        (
          await changeSharingAsCounsellor(
            db,
            counsellor,
            studentId,
            "publish",
            sharing.id,
            sharing.version,
            MOMENT,
          )
        ).kind,
    );

    expect(both).toEqual({ sooner: "kept", later: "changed" });
    expect(await statusesOf(studentId)).toEqual(["withdrawn"]);
    expect(await readShownSharing(own.db, studentId)).toBeNull();
  });
});

describe("two requests of Konselor at the same moment", () => {
  it("keep one current sharing: the second waits, then sees the first", async () => {
    const people = await addSharingStudent(
      own.db,
      "Prodi Uji Berbagi Sekaligus 4",
      "9986314004",
    );
    const ask = (db: typeof own.db) =>
      askSharing(db, people.counsellor, people.studentId, TEST_ASK, MOMENT);

    const both = await own.atOnce(ask, ask);

    expect(both.sooner).toMatchObject({ kind: "kept" });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: SHARING_CHANGED,
      sharing: { status: "waiting" },
    });
    expect(await statusesOf(people.studentId)).toEqual(["waiting"]);
  });
});
