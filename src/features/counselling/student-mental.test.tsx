// Sample NIMs of this file: 9989420000 to 9989420099.
import { eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSharingReads } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnSharing } from "./press-sharing";
import { CRISIS_ADVICE } from "./screening-words";
import { readStudentMental } from "./student-mental";
import { StudentMentalView } from "./student-mental-view";
import { addTestActor } from "./test-consents";
import { addTestScreening } from "./test-screenings";
import {
  addTestMentorOf,
  addTestRecipient,
  publishTestSharing,
  type TestShare,
} from "./test-shared";
import { addSharingStudent, type SharingStudent } from "./test-sharings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Rabu 21 October 2026.
const NOW = new Date("2026-10-21T03:00:00Z");

const SCREENING_NOTE = "Catatan uji asesmen yang hanya dibaca konselor.";

let place = 0;

/** A student with consent and a session, of a program of their own. */
async function addStudent(db: Database): Promise<SharingStudent> {
  place += 1;
  const nim = `99894200${String(place).padStart(2, "0")}`;
  return addSharingStudent(db, `Prodi Uji Mental Detail ${place}`, nim);
}

/** A screening of Sedang by SRQ-20, the latest, with self-harm ticked. */
async function addLatestScreening(db: Database, people: SharingStudent) {
  await addTestScreening(db, people.studentId, people.counsellor.id);
  await addTestScreening(db, people.studentId, people.counsellor.id, {
    screenedOn: "2026-10-20",
    instrument: "srq20",
    depression: null,
    anxiety: null,
    stress: null,
    srqYes: 7,
    selfHarm: true,
    level: "extremely_severe",
    note: SCREENING_NOTE,
  });
}

function readingsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSharingReads)
    .where(eq(counsellingSharingReads.studentId, studentId));
}

const LEVEL_TO_ALL: TestShare = {
  data: ["level"],
  recipients: ["head_of_unit", "director", "head_of_program", "mentor"],
};

function studentOf(people: SharingStudent): AccountForAccess {
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  return student;
}

describe("Kesehatan mental for Konselor", () => {
  it("gives the level, instrument and date of the latest screening with its advice, and none of its scores, mark or note", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);
      await addLatestScreening(db, people);

      const shown = await readStudentMental(
        db,
        people.counsellor,
        people.studentId,
        NOW,
      );

      expect(shown).toEqual({
        kind: "counsellor",
        screening: {
          level: "extremely_severe",
          instrument: "srq20",
          screenedOn: "2026-10-20",
          advice: CRISIS_ADVICE,
        },
      });
      expect(JSON.stringify(shown)).not.toContain(SCREENING_NOTE);
      if (!shown) throw new Error("Nothing shown.");
      const markup = renderToStaticMarkup(<StudentMentalView mental={shown} />);
      expect(markup).toContain("Kesehatan mental");
      expect(markup).toContain("Asesmen SRQ-20 pada 20 Okt 2026.");
      expect(markup).not.toContain("Risiko");
      expect(markup).not.toContain("Dipublikasikan konselor");
    });
  });

  it("says a student was never screened", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);

      const shown = await readStudentMental(
        db,
        people.counsellor,
        people.studentId,
        NOW,
      );

      expect(shown).toEqual({ kind: "counsellor", screening: null });
      if (!shown) throw new Error("Nothing shown.");
      expect(
        renderToStaticMarkup(<StudentMentalView mental={shown} />),
      ).toContain("Belum ada asesmen kesehatan mental.");
    });
  });
});

describe("Kesehatan mental for a recipient of a sharing", () => {
  it.each<RoleId>(["head_of_unit", "director", "head_of_program"])(
    "gives %s the shared level with the level's own advice, marked Dipublikasikan konselor, and logs the showing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const people = await addStudent(db);
        await addLatestScreening(db, people);
        await publishTestSharing(db, people, LEVEL_TO_ALL);
        const recipient = await addTestRecipient(db, [role], people.studentId);

        const shown = await readStudentMental(
          db,
          recipient,
          people.studentId,
          NOW,
        );

        expect(shown).toEqual({
          kind: "shared",
          screening: {
            level: "extremely_severe",
            instrument: "srq20",
            screenedOn: "2026-10-20",
            advice:
              "Konseling segera dan rujukan ke psikolog klinis atau psikiater",
          },
        });
        const sent = JSON.stringify(shown);
        expect(sent).not.toContain(SCREENING_NOTE);
        expect(sent).not.toContain(CRISIS_ADVICE);
        if (!shown) throw new Error("Nothing shown.");
        const markup = renderToStaticMarkup(
          <StudentMentalView mental={shown} />,
        );
        expect(markup).toContain("Dipublikasikan konselor");
        expect(markup).toContain("Sangat berat");
        expect(markup).not.toContain("Risiko");
        expect(await readingsOf(db, people.studentId)).toEqual([
          expect.objectContaining({ readBy: recipient.id, readAt: NOW }),
        ]);
      });
    },
  );

  it("gives Pengasuh the shared level of their own mentee", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);
      await addLatestScreening(db, people);
      await publishTestSharing(db, people, LEVEL_TO_ALL);
      const { mentor } = await addTestMentorOf(db, people.studentId);

      expect(
        await readStudentMental(db, mentor, people.studentId, NOW),
      ).toMatchObject({
        kind: "shared",
        screening: { level: "extremely_severe" },
      });
    });
  });

  it("gives no panel, and logs nothing, when the sharing does not hold the level, or names another role", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);
      await addLatestScreening(db, people);
      await publishTestSharing(db, people, {
        data: ["counselling", "summary"],
        recipients: ["director"],
      });
      const director = await addTestRecipient(
        db,
        ["director"],
        people.studentId,
      );
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );

      expect(
        await readStudentMental(db, director, people.studentId, NOW),
      ).toBeNull();
      expect(
        await readStudentMental(db, head, people.studentId, NOW),
      ).toBeNull();
      expect(await readingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("gives the same nothing for a student never shared, whether or not they were screened", async () => {
    await inTestDatabase(async (db) => {
      const screened = await addStudent(db);
      await addLatestScreening(db, screened);
      const unscreened = await addStudent(db);
      const head = await addTestActor(db, "Kepala Uji Mental", [
        "head_of_unit",
      ]);

      expect(
        await readStudentMental(db, head, screened.studentId, NOW),
      ).toBeNull();
      expect(
        await readStudentMental(db, head, unscreened.studentId, NOW),
      ).toBeNull();
    });
  });

  it("gives nothing for a student outside the recipient's program or mentees", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);
      await addLatestScreening(db, people);
      await publishTestSharing(db, people, LEVEL_TO_ALL);
      const elsewhere = await addStudent(db);
      const otherKaprodi = await addTestRecipient(
        db,
        ["head_of_program"],
        elsewhere.studentId,
      );
      const stranger = await addTestActor(db, "Pengasuh Lain Uji Mental", [
        "mentor",
      ]);

      for (const account of [otherKaprodi, stranger]) {
        expect(
          await readStudentMental(db, account, people.studentId, NOW),
        ).toBeNull();
      }
      expect(await readingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("is gone on the next load once the student withdrew the sharing", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);
      await addLatestScreening(db, people);
      const sharing = await publishTestSharing(db, people, LEVEL_TO_ALL);
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      expect(
        await readStudentMental(db, head, people.studentId, NOW),
      ).not.toBeNull();

      const withdrawn = await changeOwnSharing(
        db,
        studentOf(people),
        "withdraw",
        sharing.id,
        sharing.version,
        NOW,
      );
      expect(withdrawn.kind).toBe("kept");

      expect(
        await readStudentMental(db, head, people.studentId, NOW),
      ).toBeNull();
      expect(await readingsOf(db, people.studentId)).toHaveLength(1);
    });
  });
});

describe("Kesehatan mental asked by hand", () => {
  it.each<RoleId>([
    "assessor",
    "upk_staff",
    "dorm_manager",
    "discipline_officer",
    "student",
  ])(
    "is refused to %s, the same whether or not the data exists",
    async (role) => {
      await inTestDatabase(async (db) => {
        const shared = await addStudent(db);
        await addLatestScreening(db, shared);
        await publishTestSharing(db, shared, LEVEL_TO_ALL);
        const untouched = await addStudent(db);
        const other = await addTestRecipient(db, [role], shared.studentId);

        for (const studentId of [shared.studentId, untouched.studentId]) {
          expect(await readStudentMental(db, other, studentId, NOW)).toBeNull();
        }
        expect(await readingsOf(db, shared.studentId)).toEqual([]);
      });
    },
  );

  it("is refused for an id of nobody and a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const people = await addStudent(db);

      for (const asked of [crypto.randomUUID(), "9989420001"]) {
        expect(
          await readStudentMental(db, people.counsellor, asked, NOW),
        ).toBeNull();
      }
    });
  });
});
