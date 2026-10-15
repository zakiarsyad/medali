// Sample NIMs of this file: 9986203000 to 9986203099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingConsentChanges, counsellingConsents } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { changeConsentAsCounsellor } from "./change-consent";
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
