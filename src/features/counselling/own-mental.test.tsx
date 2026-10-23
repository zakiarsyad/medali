// Sample NIMs of this file: 9911620000 to 9911620099.
import { eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSessions, mentalHealthMarks } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { CRISIS_ADVICE } from "@/mental-health/screening-words";
import { readOwnMental } from "./own-mental";
import { OwnMentalView } from "./own-mental-view";
import { changeOwnSharing } from "./press-sharing";
import { changeSharingAsCounsellor } from "./publish-sharing";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestScreening, setTestConsent } from "./test-screenings";
import { addSharingStudent, askedSharing, TEST_ASK } from "./test-sharings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Kamis 22 October 2026.
const NOW = new Date("2026-10-22T03:00:00Z");

const HELP_LINE =
  "Butuh bicara dengan seseorang sekarang? Hubungi konselor kampus atau orang yang Anda percaya. Dalam keadaan darurat, hubungi 119.";

const SESSION_NOTE = "Catatan uji sesi.";
const SCREENING_NOTE = "Catatan rahasia asesmen uji.";
const MARK_OBSERVATION = "Pengamatan rahasia BAM uji.";

/**
 * A student with consent, one session with its next one on Senin 26
 * October, a published sharing, a Sangat berat screening with self-harm
 * ticked and a note, and a referral by BAM - Kesehatan. Everything the
 * card must never send is written into these records.
 */
async function addFullRecords(db: Database) {
  const people = await addSharingStudent(
    db,
    "Prodi Uji Kesehatan Mental Sendiri",
    "9911620001",
  );
  const { counsellor, studentId } = people;
  await db
    .update(counsellingSessions)
    .set({ nextDay: "2026-10-26" })
    .where(eq(counsellingSessions.studentId, studentId));
  const asked = await askedSharing(db, people);
  const [student] = people.students;
  if (!student) throw new Error("The student was not added.");
  const approved = await changeOwnSharing(
    db,
    student,
    "approve",
    asked.id,
    asked.version,
    NOW,
  );
  if (approved.kind !== "kept" || approved.sharing === null) {
    throw new Error("The sharing was not approved.");
  }
  const published = await changeSharingAsCounsellor(
    db,
    counsellor,
    studentId,
    "publish",
    asked.id,
    approved.sharing.version,
    NOW,
  );
  if (published.kind !== "kept") throw new Error("Not published.");
  await addTestScreening(db, studentId, counsellor.id, {
    level: "extremely_severe",
    selfHarm: true,
    depression: 20,
    anxiety: 18,
    stress: 19,
    note: SCREENING_NOTE,
  });
  const bam = await addTestActor(db, "BAM Kesehatan Uji Mental Sendiri", [
    "bam_health",
  ]);
  await db.insert(mentalHealthMarks).values({
    studentId,
    category: "refer",
    observation: MARK_OBSERVATION,
    changedBy: bam.id,
    changedAt: NOW,
  });
  return { ...people, student };
}

function shown(mental: Awaited<ReturnType<typeof readOwnMental>>) {
  if (mental === null) throw new Error("Nothing shown.");
  return mental;
}

describe("readOwnMental", () => {
  it("gives the student the level with the advice of their level, never the crisis advice, and where they stand with counselling", async () => {
    await inTestDatabase(async (db) => {
      const { student } = await addFullRecords(db);

      const mental = await readOwnMental(db, student, NOW);

      expect(mental).toEqual({
        screening: {
          level: "extremely_severe",
          instrument: "dass21",
          screenedOn: "2026-10-12",
          advice:
            "Konseling segera dan rujukan ke psikolog klinis atau psikiater",
        },
        consent: "approved",
        sessions: { count: 1, lastDay: "2026-10-19", nextDay: "2026-10-26" },
        sharing: {
          status: "published",
          recipients: expect.arrayContaining(TEST_ASK.recipients),
          data: expect.arrayContaining(TEST_ASK.data),
        },
      });
    });
  });

  it("sends no session note, no scores, no Risiko mark, no crisis advice, no screening note and no marker of BAM - Kesehatan", async () => {
    await inTestDatabase(async (db) => {
      const { student } = await addFullRecords(db);

      const mental = shown(await readOwnMental(db, student, NOW));
      const markup = renderToStaticMarkup(
        <OwnMentalView mental={mental} contact="" />,
      );

      for (const sent of [JSON.stringify(mental), markup]) {
        expect(sent).not.toContain(SESSION_NOTE);
        expect(sent).not.toContain(SCREENING_NOTE);
        expect(sent).not.toContain(MARK_OBSERVATION);
        expect(sent).not.toContain(CRISIS_ADVICE);
        expect(sent).not.toContain("Risiko");
        expect(sent).not.toContain("Catatan konselor (rahasia)");
        expect(sent).not.toContain(TEST_ASK.summary);
        expect(sent).not.toMatch(/selfHarm|depression|anxiety|stress|refer/);
      }
    });
  });

  it("gives a sharing request that waits for the student, without its summary", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Mental Menunggu",
        "9911620004",
      );
      await askedSharing(db, people);
      const [student] = people.students;
      if (!student) throw new Error("The student was not added.");

      const mental = shown(await readOwnMental(db, student, NOW));

      expect(mental.sharing).toEqual({
        status: "waiting",
        recipients: expect.arrayContaining(TEST_ASK.recipients),
        data: expect.arrayContaining(TEST_ASK.data),
      });
      expect(JSON.stringify(mental)).not.toContain(TEST_ASK.summary);
    });
  });

  it("says a student never asked, never screened and with no session where they stand", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Mental Kosong", [
        "9911620002",
      ]);
      const [student] = people.students;
      if (!student) throw new Error("The student was not added.");

      expect(await readOwnMental(db, student, NOW)).toEqual({
        screening: null,
        consent: null,
        sessions: null,
        sharing: null,
      });
    });
  });

  it("reads only the account's own student, even with another student's records beside it", async () => {
    await inTestDatabase(async (db) => {
      await addFullRecords(db);
      const people = await addTestPeople(db, "Prodi Uji Mental Lain", [
        "9911620003",
      ]);
      const [other] = people.students;
      if (!other) throw new Error("The student was not added.");
      await setTestConsent(db, people.studentIds[0] ?? "", other.id, "waiting");

      expect(await readOwnMental(db, other, NOW)).toEqual({
        screening: null,
        consent: "waiting",
        sessions: null,
        sharing: null,
      });
    });
  });

  it.each([
    ["head_of_unit", "Kepala Unit"],
    ["counsellor", "Konselor"],
    ["bam_health", "BAM - Kesehatan"],
    ["mentor", "Pengasuh"],
    ["head_of_program", "Ketua Program Studi"],
  ] as const)(
    "refuses %s (%s), even on an account that names the student",
    async (role: RoleId, _title: string) => {
      await inTestDatabase(async (db) => {
        const { student } = await addFullRecords(db);
        const account: AccountForAccess = { ...student, roles: [role] };

        expect(await readOwnMental(db, account, NOW)).toBeNull();
      });
    },
  );

  it("refuses a Mahasiswa account with no student", async () => {
    await inTestDatabase(async (db) => {
      const account = await addTestActor(db, "Tanpa Mahasiswa Uji Mental", [
        "student",
      ]);

      expect(await readOwnMental(db, account, NOW)).toBeNull();
    });
  });
});

describe("OwnMentalView", () => {
  const EMPTY = {
    screening: null,
    consent: null,
    sessions: null,
    sharing: null,
  } as const;

  it("shows the level, the instrument, the day and the advice, as in the prototype", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView
        mental={{
          ...EMPTY,
          screening: {
            level: "moderate",
            instrument: "srq20",
            screenedOn: "2026-10-12",
            advice: "Konseling",
          },
        }}
        contact=""
      />,
    );

    expect(markup).toContain("Kesehatan mental");
    expect(markup).toContain("Sedang");
    expect(markup).toContain(
      "Asesmen SRQ-20 pada 12 Okt 2026. Rekomendasi: Konseling.",
    );
  });

  it("says there is no screening, no consent asked and no session", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView mental={EMPTY} contact="" />,
    );

    expect(markup).toContain("Belum ada asesmen kesehatan mental.");
    expect(markup).toContain("Persetujuan konseling");
    expect(markup).toContain("Belum diminta");
    expect(markup).toContain("Sesi konseling");
    expect(markup).toContain("Belum ada<");
    expect(markup).not.toContain("Sesi berikutnya");
  });

  it("shows how many sessions, the latest, and the next one", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView
        mental={{
          ...EMPTY,
          consent: "approved",
          sessions: { count: 3, lastDay: "2026-10-19", nextDay: "2026-10-26" },
        }}
        contact=""
      />,
    );

    expect(markup).toContain("Disetujui");
    expect(markup).toContain("3 sesi, terakhir 19 Okt 2026");
    expect(markup).toContain("Sesi berikutnya");
    expect(markup).toContain("26 Okt 2026");
  });

  it("says a consent request waits for an answer, with Buka Konseling, and no button to answer it here", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView mental={{ ...EMPTY, consent: "waiting" }} contact="" />,
    );

    expect(markup).toContain(
      "Permintaan persetujuan konseling menunggu jawaban Anda.",
    );
    expect(markup).toContain('href="/konseling"');
    expect(markup).toContain(">Buka Konseling</a>");
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("berbagi data");
  });

  it("says a sharing request waits for an answer, with Buka Konseling", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView
        mental={{
          ...EMPTY,
          consent: "approved",
          sharing: {
            status: "waiting",
            recipients: ["mentor"],
            data: ["level"],
          },
        }}
        contact=""
      />,
    );

    expect(markup).toContain(
      "Permintaan persetujuan berbagi data menunggu jawaban Anda.",
    );
    expect(markup).toContain(">Buka Konseling</a>");
    expect(markup).not.toContain("Data dibagikan");
    expect(markup).not.toContain("Permintaan persetujuan konseling");
  });

  it.each([
    ["published", "Data dibagikan"],
    ["approved", "Persetujuan berbagi data diberikan"],
  ] as const)(
    "says with whom and what a %s sharing is shared, and points to Konseling to withdraw",
    (status, title) => {
      const markup = renderToStaticMarkup(
        <OwnMentalView
          mental={{
            ...EMPTY,
            consent: "approved",
            sharing: {
              status,
              recipients: ["head_of_unit", "mentor"],
              data: ["level", "counselling"],
            },
          }}
          contact=""
        />,
      );

      expect(markup).toContain(
        `<b>${title}</b> kepada Kepala Unit Pembangunan Karakter, Pengasuh: tingkat hasil asesmen dan rekomendasi tindak lanjut; status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi.`,
      );
      expect(markup).toContain("Untuk mencabut, buka Konseling.");
      expect(markup).toContain(">Buka Konseling</a>");
      expect(markup).not.toContain("menunggu jawaban Anda");
      expect(markup).not.toContain("<button");
    },
  );

  it("shows no notice for a consent that is given, declined or withdrawn", () => {
    for (const consent of ["approved", "declined", "withdrawn"] as const) {
      const markup = renderToStaticMarkup(
        <OwnMentalView mental={{ ...EMPTY, consent }} contact="" />,
      );

      expect(markup).not.toContain("Buka Konseling");
    }
  });

  it("keeps the help line under the notices", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView mental={{ ...EMPTY, consent: "waiting" }} contact="" />,
    );

    expect(markup.indexOf(HELP_LINE)).toBeGreaterThan(
      markup.indexOf("Buka Konseling"),
    );
  });

  it("always ends with the help line, and nothing after it while the campus contact is empty", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView mental={EMPTY} contact="" />,
    );

    expect(markup).toContain(HELP_LINE);
    expect(markup.endsWith(`${HELP_LINE}</p></section>`)).toBe(true);
    expect(markup).not.toContain("Kontak konseling kampus");
  });

  it("puts the campus contact after the help line once it is set", () => {
    const markup = renderToStaticMarkup(
      <OwnMentalView mental={EMPTY} contact="Ruang konseling, Gedung B" />,
    );

    const help = markup.indexOf(HELP_LINE);
    const contact = markup.indexOf(
      "Kontak konseling kampus: Ruang konseling, Gedung B",
    );
    expect(help).toBeGreaterThan(-1);
    expect(contact).toBeGreaterThan(help);
  });
});
