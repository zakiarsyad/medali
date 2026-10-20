import type { Database } from "@/db/connect";
import { counsellingConsents, mentalHealthScreenings } from "@/db/schema";
import type { ConsentStatus } from "./consent-ids";

/** Made-up screenings and consents for the checks of this area. */

type Screening = typeof mentalHealthScreenings.$inferInsert;

/** A DASS-21 screening of Ringan, changed by what is given. */
export async function addTestScreening(
  db: Database,
  studentId: string,
  by: string,
  more: Partial<Screening> = {},
): Promise<string> {
  const [added] = await db
    .insert(mentalHealthScreenings)
    .values({
      studentId,
      screenedOn: "2026-10-12",
      instrument: "dass21",
      depression: 6,
      anxiety: 3,
      stress: 8,
      srqYes: null,
      selfHarm: false,
      level: "mild",
      note: "",
      savedBy: by,
      savedAt: new Date("2026-10-12T03:00:00Z"),
      ...more,
    })
    .returning({ id: mentalHealthScreenings.id });
  if (!added) throw new Error("The screening was not added.");
  return added.id;
}

/** A student's consent to counselling, as it stands now. */
export async function setTestConsent(
  db: Database,
  studentId: string,
  by: string,
  status: ConsentStatus,
): Promise<void> {
  await db.insert(counsellingConsents).values({
    studentId,
    status,
    way: status === "approved" ? "paper" : null,
    changedBy: by,
    changedAt: new Date("2026-10-01T03:00:00Z"),
  });
}
