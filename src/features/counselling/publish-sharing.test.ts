// Sample NIMs of this file: 9986313000 to 9986313099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSharingChanges, counsellingSharings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { askSharing } from "./change-sharing";
import { changeOwnSharing } from "./press-sharing";
import { changeSharingAsCounsellor } from "./publish-sharing";
import { readShownSharing } from "./sharing-reads";
import { recipientSees } from "./sharing-rules";
import type { SharingView } from "./sharing-view";
import {
  CANCELLED_MESSAGE,
  PAPER_MESSAGE,
  PULLED_MESSAGE,
  publishedMessage,
  SHARING_CHANGED,
  SHARING_NOT_ALLOWED,
} from "./sharing-words";
import { addTestActor } from "./test-consents";
import {
  ASKED_AT,
  addSharingStudent,
  askedSharing,
  type SharingStudent,
  TEST_ASK,
} from "./test-sharings";

const inTestDatabase = withTestDatabase();

const NAME = "Mahasiswa Uji Konseling 1";

const ANSWERED_AT = new Date(ASKED_AT.getTime() + 60_000);
const PUBLISHED_AT = new Date(ASKED_AT.getTime() + 120_000);
const LATER = new Date(ASKED_AT.getTime() + 180_000);

function studentOf(people: SharingStudent) {
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  return student;
}

function sharingsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSharings)
    .where(eq(counsellingSharings.studentId, studentId))
    .orderBy(asc(counsellingSharings.askedAt));
}

function stepsOf(db: Database, sharingId: string) {
  return db
    .select()
    .from(counsellingSharingChanges)
    .where(eq(counsellingSharingChanges.sharingId, sharingId))
    .orderBy(asc(counsellingSharingChanges.changedAt));
}

/** A request the student approved, as Konselor's panel shows it then. */
async function approvedSharing(
  db: Database,
  people: SharingStudent,
): Promise<SharingView> {
  const asked = await askedSharing(db, people);
  const approved = await changeOwnSharing(
    db,
    studentOf(people),
    "approve",
    asked.id,
    asked.version,
    ANSWERED_AT,
  );
  if (approved.kind !== "kept") throw new Error("Not approved.");
  return { ...asked, status: "approved", version: ANSWERED_AT.toISOString() };
}

async function publishedSharing(
  db: Database,
  people: SharingStudent,
): Promise<SharingView> {
  const approved = await approvedSharing(db, people);
  const published = await changeSharingAsCounsellor(
    db,
    people.counsellor,
    people.studentId,
    "publish",
    approved.id,
    approved.version,
    PUBLISHED_AT,
  );
  if (published.kind !== "kept" || published.sharing === null) {
    throw new Error("Not published.");
  }
  return published.sharing;
}

describe("Publikasikan", () => {
  it("makes an approved sharing Dipublikasikan with the date and the Konselor's name, logged, and shown to the recipients ticked", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 1",
        "9986313001",
      );
      const approved = await approvedSharing(db, people);

      const outcome = await changeSharingAsCounsellor(
        db,
        people.counsellor,
        people.studentId,
        "publish",
        approved.id,
        approved.version,
        PUBLISHED_AT,
      );

      expect(outcome).toMatchObject({
        kind: "kept",
        done: publishedMessage(NAME),
        sharing: {
          status: "published",
          publishedAt: PUBLISHED_AT,
          publishedByName: "Konselor Uji",
        },
      });
      const [kept] = await sharingsOf(db, people.studentId);
      expect(kept).toMatchObject({
        status: "published",
        way: "online",
        publishedBy: people.counsellor.id,
        publishedAt: PUBLISHED_AT,
      });
      expect((await stepsOf(db, approved.id)).at(-1)).toMatchObject({
        changedBy: people.counsellor.id,
        step: "publish",
        statusBefore: "approved",
        statusAfter: "published",
        shared: { recipients: ["head_of_unit", "mentor"] },
      });
      const shown = await readShownSharing(db, people.studentId);
      expect(shown?.id).toBe(approved.id);
      if (!shown) throw new Error("Not shown.");
      expect(recipientSees(shown, "mentor")).toBe(true);
      expect(recipientSees(shown, "director")).toBe(false);
    });
  });

  it("is refused for a sharing that is not Disetujui, changing nothing", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 2",
        "9986313002",
      );
      const asked = await askedSharing(db, people);

      const outcome = await changeSharingAsCounsellor(
        db,
        people.counsellor,
        people.studentId,
        "publish",
        asked.id,
        asked.version,
      );

      expect(outcome).toMatchObject({
        kind: "changed",
        error: SHARING_CHANGED,
        sharing: { status: "waiting" },
      });
      expect(await stepsOf(db, asked.id)).toHaveLength(1);
      expect(await readShownSharing(db, people.studentId)).toBeNull();
    });
  });

  it("is refused once the sharing changed since the panel showed it", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 3",
        "9986313003",
      );
      const asked = await askedSharing(db, people);
      await changeOwnSharing(
        db,
        studentOf(people),
        "approve",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );

      expect(
        await changeSharingAsCounsellor(
          db,
          people.counsellor,
          people.studentId,
          "publish",
          asked.id,
          asked.version,
        ),
      ).toMatchObject({ kind: "changed", sharing: { status: "approved" } });
    });
  });
});

describe("Catat persetujuan tertulis", () => {
  it("makes a waiting request Disetujui with Form tertulis", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 4",
        "9986313004",
      );
      const asked = await askedSharing(db, people);

      const outcome = await changeSharingAsCounsellor(
        db,
        people.counsellor,
        people.studentId,
        "record_paper",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );

      expect(outcome).toMatchObject({
        kind: "kept",
        done: PAPER_MESSAGE,
        sharing: { status: "approved", way: "paper", answeredAt: ANSWERED_AT },
      });
      expect((await stepsOf(db, asked.id)).at(-1)).toMatchObject({
        changedBy: people.counsellor.id,
        step: "record_paper",
        statusBefore: "waiting",
        statusAfter: "approved",
      });
    });
  });
});

describe("Batalkan permintaan, Batalkan and Tarik publikasi", () => {
  it.each([
    ["waiting", CANCELLED_MESSAGE],
    ["approved", CANCELLED_MESSAGE],
    ["published", PULLED_MESSAGE],
  ] as const)(
    "make a %s sharing Ditarik at once, logged, shown to nobody, and a new request may be sent",
    async (status, message) => {
      await inTestDatabase(async (db) => {
        const people = await addSharingStudent(
          db,
          `Prodi Uji Tarik ${status}`,
          `99863130${10 + ["waiting", "approved", "published"].indexOf(status)}`,
        );
        const prepare = {
          waiting: askedSharing,
          approved: approvedSharing,
          published: publishedSharing,
        }[status];
        const sharing = await prepare(db, people);

        const outcome = await changeSharingAsCounsellor(
          db,
          people.counsellor,
          people.studentId,
          "cancel",
          sharing.id,
          sharing.version,
          LATER,
        );

        expect(outcome).toMatchObject({
          kind: "kept",
          done: message,
          sharing: { status: "cancelled" },
        });
        expect((await stepsOf(db, sharing.id)).at(-1)).toMatchObject({
          changedBy: people.counsellor.id,
          step: "cancel",
          statusBefore: status,
          statusAfter: "cancelled",
        });
        expect(await readShownSharing(db, people.studentId)).toBeNull();
        expect(
          await askSharing(db, people.counsellor, people.studentId, TEST_ASK),
        ).toMatchObject({ kind: "kept" });
      });
    },
  );

  it("are kept even when the panel showed an older version", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 5",
        "9986313005",
      );
      const asked = await askedSharing(db, people);
      await changeOwnSharing(
        db,
        studentOf(people),
        "approve",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );

      expect(
        await changeSharingAsCounsellor(
          db,
          people.counsellor,
          people.studentId,
          "cancel",
          asked.id,
          asked.version,
        ),
      ).toMatchObject({ kind: "kept", sharing: { status: "cancelled" } });
    });
  });
});

describe("Cabut persetujuan berbagi of a published sharing", () => {
  it("makes it Dicabut, so recipients stop seeing it at once", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 6",
        "9986313006",
      );
      const published = await publishedSharing(db, people);
      expect(await readShownSharing(db, people.studentId)).not.toBeNull();

      const outcome = await changeOwnSharing(
        db,
        studentOf(people),
        "withdraw",
        published.id,
        published.version,
        LATER,
      );

      expect(outcome).toMatchObject({ kind: "kept", sharing: null });
      expect(await readShownSharing(db, people.studentId)).toBeNull();
      expect(
        (await stepsOf(db, published.id)).map((line) => line.step),
      ).toEqual(["ask", "approve", "publish", "withdraw"]);
    });
  });
});

describe("a hand-made request to publish, record or cancel", () => {
  it("is refused to every role but Konselor, Pengasuh, Kepala Unit and Mahasiswa among them, changing nothing", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 7",
        "9986313007",
      );
      const approved = await approvedSharing(db, people);
      const others = ROLE_IDS.filter((role) => role !== "counsellor");
      expect(others).toEqual(
        expect.arrayContaining(["mentor", "head_of_unit", "student"]),
      );
      for (const role of others) {
        const actor = await addTestActor(db, `Uji ${role}`, [role]);
        for (const move of ["publish", "record_paper", "cancel"] as const) {
          expect(
            await changeSharingAsCounsellor(
              db,
              actor,
              people.studentId,
              move,
              approved.id,
              approved.version,
            ),
          ).toEqual({ kind: "refused", error: SHARING_NOT_ALLOWED });
        }
      }
      const [kept] = await sharingsOf(db, people.studentId);
      expect(kept?.status).toBe("approved");
    });
  });

  it("finds no sharing of another student than the one named", async () => {
    await inTestDatabase(async (db) => {
      const one = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 8",
        "9986313008",
      );
      const other = await addSharingStudent(
        db,
        "Prodi Uji Publikasi 9",
        "9986313009",
      );
      const approved = await approvedSharing(db, other);

      const outcome = await changeSharingAsCounsellor(
        db,
        one.counsellor,
        one.studentId,
        "publish",
        approved.id,
        approved.version,
      );

      expect(outcome).toMatchObject({ kind: "changed", sharing: null });
      const [kept] = await sharingsOf(db, other.studentId);
      expect(kept?.status).toBe("approved");
    });
  });
});
