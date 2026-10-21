import type { Database } from "@/db/connect";
import { counsellingSessions } from "@/db/schema";
import { askSharing } from "./change-sharing";
import type { SharingView } from "./sharing-view";
import type { TestPeople } from "./test-consents";
import { addConsentedPeople, CONSENTED_AT } from "./test-sessions";

/** Made-up sharings for the checks of this area. */

// 10:00 on campus on Rabu 21 October 2026.
export const ASKED_AT = new Date("2026-10-21T03:00:00Z");

/** What Konselor asks to share in most checks. */
export const TEST_ASK = {
  data: ["counselling", "summary"],
  recipients: ["mentor", "head_of_unit"],
  summary: "Mahasiswa sedang dalam pendampingan rutin.",
};

/** A student with consent and a session, and their own account. */
export interface SharingStudent extends TestPeople {
  studentId: string;
}

/**
 * A Konselor and a student with a signed paper consent and one session
 * the Konselor wrote down, ready to be asked to share.
 */
export async function addSharingStudent(
  db: Database,
  program: string,
  nim: string,
): Promise<SharingStudent> {
  const people = await addConsentedPeople(db, program, [nim]);
  const [studentId] = people.studentIds;
  if (!studentId) throw new Error("The student was not added.");
  await db.insert(counsellingSessions).values({
    studentId,
    day: "2026-10-19",
    kind: "individual_in_person",
    topic: "academic",
    notes: "Catatan uji sesi.",
    followUp: "monitoring",
    writtenBy: people.counsellor.id,
    writtenAt: CONSENTED_AT,
    changedBy: people.counsellor.id,
    changedAt: CONSENTED_AT,
  });
  return { ...people, studentId };
}

/** A request the test Konselor sent, as their panel shows it. */
export async function askedSharing(
  db: Database,
  people: SharingStudent,
  now: Date = ASKED_AT,
): Promise<SharingView> {
  const asked = await askSharing(
    db,
    people.counsellor,
    people.studentId,
    TEST_ASK,
    now,
  );
  if (asked.kind !== "kept" || asked.sharing === null) {
    throw new Error("The request was not kept.");
  }
  return asked.sharing;
}
