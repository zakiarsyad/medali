// Sample NIMs of this file: 9986326000 to 9986326099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingSharingReads } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnSharing } from "./press-sharing";
import type { ScreeningParams } from "./screening-address";
import { readScreeningList } from "./screening-board";
import { openScreeningDetail } from "./screening-detail";
import { CRISIS_ADVICE, RISK_WORDS } from "./screening-words";
import { readSharedList } from "./shared-board";
import { openSharedDetail } from "./shared-detail";
import { SHARED_GONE } from "./shared-words";
import type { SharedData, SharingRecipient } from "./sharing-ids";
import type { SharingView } from "./sharing-view";
import { addTestActor } from "./test-consents";
import { addTestScreening } from "./test-screenings";
import { addTestRecipient, publishTestSharing } from "./test-shared";
import { addSharingStudent, type SharingStudent } from "./test-sharings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Rabu 21 October 2026.
const NOW = new Date("2026-10-21T03:00:00Z");

const NOTE = "Catatan rahasia uji konselor.";

const SCORES = { depression: 17, anxiety: 13, stress: 19 };

const EVERYONE: ScreeningParams = {
  query: "",
  filter: "all",
  page: 1,
  sharedPage: 1,
};

let place = 0;

interface Screened {
  people: SharingStudent;
  sharing: SharingView;
}

/**
 * A student whose latest screening is Sangat berat with "Risiko" and a
 * note, published with the data given to the recipients given.
 */
async function screenedStudent(
  db: Database,
  data: SharedData[],
  recipients: SharingRecipient[],
): Promise<Screened> {
  place += 1;
  const nim = `99863260${String(place).padStart(2, "0")}`;
  const people = await addSharingStudent(db, `Prodi Uji Tingkat ${place}`, nim);
  await addTestScreening(db, people.studentId, people.counsellor.id, {
    ...SCORES,
    selfHarm: true,
    level: "extremely_severe",
    note: NOTE,
  });
  const sharing = await publishTestSharing(db, people, { data, recipients });
  return { people, sharing };
}

function readingsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSharingReads)
    .where(eq(counsellingSharingReads.studentId, studentId));
}

/** What the server sent holds none of the scores, the mark or the note. */
function expectNothingSecret(sent: unknown) {
  const text = JSON.stringify(sent);
  for (const secret of [
    NOTE,
    CRISIS_ADVICE,
    RISK_WORDS,
    "selfHarm",
    "risk",
    "srqYes",
    "depression",
    "anxiety",
    "stress",
    "note",
  ]) {
    expect(text).not.toContain(secret);
  }
}

describe("a recipient's request for a shared level", () => {
  it("sends the level, instrument and date only, never the scores, the Risiko mark or the note", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await screenedStudent(db, ["level"], ["head_of_unit"]);
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );

      const list = await readSharedList(db, head, 1, NOW);
      const opened = await openSharedDetail(db, head, people.studentId, NOW);

      expect(list?.rows[0]?.level).toBe("extremely_severe");
      expect(opened.ok && Object.keys(opened.value.screening ?? {})).toEqual([
        "level",
        "instrument",
        "screenedOn",
      ]);
      expectNothingSecret(list);
      expectNothingSecret(opened);
    });
  });

  it("sends no level of a student who shared without it", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await screenedStudent(
        db,
        ["counselling"],
        ["director"],
      );
      const director = await addTestRecipient(
        db,
        ["director"],
        people.studentId,
      );

      const list = await readSharedList(db, director, 1, NOW);
      const opened = await openSharedDetail(
        db,
        director,
        people.studentId,
        NOW,
      );

      expect(list?.rows[0]?.level).toBeNull();
      expect(opened).toMatchObject({ ok: true, value: { screening: null } });
      expect(JSON.stringify([list, opened])).not.toContain("extremely_severe");
      expectNothingSecret(list);
      expectNothingSecret(opened);
    });
  });

  it("is refused for a student not shared with the recipient, sending nothing of the level and logging nothing", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await screenedStudent(db, ["level"], ["mentor"]);
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      const stranger = await addTestActor(db, "Pengasuh Lain", ["mentor"]);

      for (const recipient of [head, stranger]) {
        expect(
          await openSharedDetail(db, recipient, people.studentId, NOW),
        ).toEqual({ ok: false, error: SHARED_GONE });
        const list = await readSharedList(db, recipient, 1, NOW);
        expect(list?.rows).toEqual([]);
        expect(list?.needCounselling).toBe(0);
      }
      expect(await readingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("never gives a recipient Konselor's list or screenings, where the scores, the mark and the note are", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await screenedStudent(
        db,
        ["level"],
        ["head_of_unit", "director", "head_of_program", "mentor"],
      );
      for (const role of [
        "head_of_unit",
        "director",
        "head_of_program",
        "mentor",
      ] as const) {
        const recipient: AccountForAccess = await addTestRecipient(
          db,
          [role],
          people.studentId,
        );
        expect(
          await openScreeningDetail(db, recipient, people.studentId, NOW),
        ).toBeNull();
        expect(await readScreeningList(db, recipient, EVERYONE)).toBeNull();
      }
    });
  });

  it("is refused once the student withdraws while the recipient reads, and each showing before it is logged", async () => {
    await inTestDatabase(async (db) => {
      const { people, sharing } = await screenedStudent(
        db,
        ["level", "counselling"],
        ["head_of_unit"],
      );
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      await readSharedList(db, head, 1, NOW);
      const opened = await openSharedDetail(db, head, people.studentId, NOW);
      expect(opened.ok).toBe(true);
      expect(await readingsOf(db, people.studentId)).toHaveLength(2);

      const [student] = people.students;
      if (!student) throw new Error("Student missing.");
      const withdrawn = await changeOwnSharing(
        db,
        student,
        "withdraw",
        sharing.id,
        sharing.version,
        NOW,
      );
      expect(withdrawn.kind).toBe("kept");

      expect(await openSharedDetail(db, head, people.studentId, NOW)).toEqual({
        ok: false,
        error: SHARED_GONE,
      });
      expect(await readSharedList(db, head, 1, NOW)).toMatchObject({
        rows: [],
        matching: 0,
      });
      const readings = await readingsOf(db, people.studentId);
      expect(readings).toHaveLength(2);
      for (const reading of readings) {
        expect(reading).toMatchObject({
          sharingId: sharing.id,
          readBy: head.id,
          readAt: NOW,
        });
      }
    });
  });
});
