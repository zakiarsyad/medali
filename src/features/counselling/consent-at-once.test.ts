// Sample NIMs of this file: 9986203000 to 9986203099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingConsentChanges, counsellingConsents } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { changeConsentAsCounsellor, changeOwnConsent } from "./change-consent";
import { NO_CONSENT_VERSION } from "./consent-view";
import { CHANGED_SINCE } from "./consent-words";
import { addTestPeople } from "./test-consents";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("consent");

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

async function linesOf(consentId: string) {
  return own.db
    .select()
    .from(counsellingConsentChanges)
    .where(eq(counsellingConsentChanges.consentId, consentId));
}

describe("two first presses of Konselor at the same moment", () => {
  it("keep one consent: the second waits, then sees the first and is refused", async () => {
    const { counsellor, studentIds } = await addTestPeople(
      own.db,
      "Prodi Uji Persetujuan Sekaligus 1",
      ["9986203001"],
    );
    const [studentId] = studentIds;

    const both = await own.atOnce(
      (db) =>
        changeConsentAsCounsellor(
          db,
          counsellor,
          studentId,
          "ask",
          NO_CONSENT_VERSION,
          MOMENT,
        ),
      (db) =>
        changeConsentAsCounsellor(
          db,
          counsellor,
          studentId,
          "record_paper",
          NO_CONSENT_VERSION,
          MOMENT,
        ),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      consent: { status: "waiting" },
    });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: CHANGED_SINCE,
      consent: { status: "waiting" },
    });
    const kept = await own.db
      .select()
      .from(counsellingConsents)
      .where(eq(counsellingConsents.studentId, studentId ?? ""));
    expect(kept).toHaveLength(1);
    expect(await linesOf(kept[0]?.id ?? "")).toHaveLength(1);
  });
});

/** A student asked by Konselor, with the version their page shows. */
async function askedStudent(program: string, nim: string) {
  const people = await addTestPeople(own.db, program, [nim]);
  const asked = await changeConsentAsCounsellor(
    own.db,
    people.counsellor,
    people.studentIds[0],
    "ask",
    NO_CONSENT_VERSION,
    MOMENT,
  );
  if (asked.kind !== "kept") throw new Error(asked.error);
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  return { ...people, student, version: asked.consent.version };
}

// 10:00 on campus on 17 October 2026.
const ANSWERED = new Date("2026-10-17T03:00:00Z");

describe("Setujui pressed twice at the same moment", () => {
  it("keeps one answer: the second waits, then is refused with the current status", async () => {
    const { student, version } = await askedStudent(
      "Prodi Uji Persetujuan Sekaligus 2",
      "9986203002",
    );

    const both = await own.atOnce(
      (db) => changeOwnConsent(db, student, "approve", version, ANSWERED),
      (db) => changeOwnConsent(db, student, "approve", version, ANSWERED),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      consent: { status: "approved", way: "online" },
    });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: CHANGED_SINCE,
      consent: { status: "approved", way: "online" },
    });
  });
});

describe("Konselor and the student on the same consent at the same moment", () => {
  it("keep the first change; the other person is refused and sees the current status", async () => {
    const { counsellor, student, studentIds, version } = await askedStudent(
      "Prodi Uji Persetujuan Sekaligus 3",
      "9986203003",
    );

    const both = await own.atOnce(
      (db) =>
        changeConsentAsCounsellor(
          db,
          counsellor,
          studentIds[0],
          "record_paper",
          version,
          ANSWERED,
        ),
      (db) => changeOwnConsent(db, student, "decline", version, ANSWERED),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      consent: { status: "approved", way: "paper" },
    });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: CHANGED_SINCE,
      consent: { status: "approved", way: "paper", counsellorName: null },
    });
  });
});
