import type { Database } from "@/db/connect";
import { changeConsentAsCounsellor } from "./change-consent";
import { NO_CONSENT_VERSION } from "./consent-view";
import type { SentSession } from "./session-rules";
import { addTestPeople, type TestPeople } from "./test-consents";

/** Made-up sessions for the checks of this area. */

// 10:00 on campus on Senin 19 October 2026.
export const CONSENTED_AT = new Date("2026-10-19T03:00:00Z");

/** A session of Senin 19 October 2026, as Konselor sends it. */
export const TEST_SESSION: SentSession = {
  day: "2026-10-19",
  kind: "individual_in_person",
  topic: "academic",
  notes: "Catatan uji sesi.",
  followUp: "monitoring",
  nextDay: "",
};

/**
 * A Konselor and students, each with a signed paper consent the test
 * Konselor recorded: Disetujui.
 */
export async function addConsentedPeople(
  db: Database,
  program: string,
  nims: string[],
): Promise<TestPeople> {
  const people = await addTestPeople(db, program, nims);
  for (const studentId of people.studentIds) {
    const recorded = await changeConsentAsCounsellor(
      db,
      people.counsellor,
      studentId,
      "record_paper",
      NO_CONSENT_VERSION,
      CONSENTED_AT,
    );
    if (recorded.kind !== "kept") throw new Error(recorded.error);
  }
  return people;
}
