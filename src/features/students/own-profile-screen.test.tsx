// Sample NIMs of this file: 9900002400 to 9900002499. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OwnProfile } from "./own-profile";
import { OwnProfileScreen } from "./own-profile-screen";
import type { ShownMentorGroup } from "./student-mentor-group";

/** A student in no kelompok pengasuhan, who lives in no dorm. */
const STUDENT: OwnProfile = {
  id: "00000000-0000-4000-8000-000000000092",
  nim: "9900002401",
  name: "Profil Uji Layar",
  status: "active",
  isAffirmation: true,
  isSeedling: false,
  isInternational: false,
  isBlended: true,
  studyProgram: "Prodi Uji Layar",
  entryPath: "regular",
  originAgency: null,
  cohortYear: 2025,
  className: null,
  province: "Bali",
  sex: "female",
  mentorGroup: null,
  residence: null,
};

const GROUP: ShownMentorGroup = {
  cohortYear: 2025,
  entryPath: "regular",
  number: 1,
  programCode: "UJI",
  mentor: { name: "Pengasuh Uji Layar", title: "M.Si.", since: "2025-08-01" },
  earlierMentors: [],
};

const PERIOD = { startYear: 2026, term: "odd" } as const;

function screenOf(student: OwnProfile, period = PERIOD): string {
  return renderToStaticMarkup(
    <OwnProfileScreen student={student} period={period} />,
  );
}

describe("OwnProfileScreen", () => {
  it("shows the name as the title, the line under it and the status", () => {
    const screen = screenOf(STUDENT);

    expect(screen).toMatch(/<h1[^>]*>Profil Uji Layar<\/h1>/);
    expect(screen).toContain(
      "9900002401 · Prodi Uji Layar · Semester 3, tahap penumbuhan",
    );
    expect(screen).toMatch(/<span[^>]*>Aktif<\/span>/);
  });

  it("shows the facts of the first card, with the category tags", () => {
    const screen = screenOf(STUDENT);

    expect(screen).toContain("<dt>Angkatan</dt><dd>2025 · Reguler</dd>");
    expect(screen).toContain(
      "<dt>Provinsi (domisili sesuai NIK)</dt><dd>Bali</dd>",
    );
    expect(screen).toContain(
      "<dt>Semester · tahap</dt><dd>Semester 3 · Tahap Penumbuhan (tingkat 2)</dd>",
    );
    expect(screen).toContain("<dt>Kelas</dt><dd>Belum tercatat</dd>");
    expect(screen).toContain("<dt>Jenis kelamin</dt><dd>Perempuan</dd>");
    expect(screen).toMatch(/<span[^>]*>Afirmasi<\/span>/);
    expect(screen).toMatch(/<span[^>]*>Blended learning<\/span>/);
    expect(screen).not.toContain("Pembibitan");
    expect(screen).not.toContain("Instansi asal");
  });

  it("shows Instansi asal for an alih program student only", () => {
    const screen = screenOf({
      ...STUDENT,
      entryPath: "transfer",
      originAgency: "Direktorat Jenderal Pajak",
    });

    expect(screen).toContain(
      "<dt>Instansi asal</dt><dd>Direktorat Jenderal Pajak</dd>",
    );
  });

  it("says Tidak aktif under the name of a student on Cuti, who keeps their semester in the card", () => {
    const screen = screenOf({ ...STUDENT, status: "on_leave" });

    expect(screen).toContain("9900002401 · Prodi Uji Layar · Tidak aktif");
    expect(screen).toContain("Semester 3 · Tahap Penumbuhan (tingkat 2)");
    expect(screen).toMatch(/<span[^>]*>Cuti<\/span>/);
  });

  it("holds nothing that changes the record, and says who corrects it", () => {
    const screen = screenOf(STUDENT);

    expect(screen).not.toMatch(/<(form|button|input|select|textarea|a)\b/);
    expect(screen).toContain(
      "Data ini berasal dari data kampus. Bila ada yang keliru, hubungi Unit Pembangunan Karakter.",
    );
  });

  it("shows the pengasuh with the gelar, and under it the group and since when", () => {
    const screen = screenOf({ ...STUDENT, mentorGroup: GROUP });

    expect(screen).toMatch(
      /<dt>Pengasuh<\/dt><dd>Pengasuh Uji Layar, M\.Si\.<small[^>]*>Kelompok pengasuhan KP 25-UJI-01, diasuh sejak 1 Agu 2025\.<\/small><\/dd>/,
    );
  });

  it("adds the pengasuh before when the group has had any", () => {
    const group = { ...GROUP, earlierMentors: ["Awal Uji", "Tengah Uji"] };

    const screen = screenOf({ ...STUDENT, mentorGroup: group });

    expect(screen).toContain(
      "diasuh sejak 1 Agu 2025. Sebelumnya: Awal Uji, Tengah Uji.",
    );
  });

  it("says Belum ditetapkan for a student in no group", () => {
    const screen = screenOf(STUDENT);

    expect(screen).toContain("<dt>Pengasuh</dt><dd>Belum ditetapkan</dd>");
    expect(screen).not.toContain("Kelompok pengasuhan");
  });

  it("says Belum ditetapkan with the group under it for a group left without a pengasuh", () => {
    const screen = screenOf({
      ...STUDENT,
      mentorGroup: { ...GROUP, mentor: null },
    });

    expect(screen).toMatch(
      /<dt>Pengasuh<\/dt><dd>Belum ditetapkan<small[^>]*>Kelompok pengasuhan KP 25-UJI-01\.<\/small><\/dd>/,
    );
  });

  it("names the pengasuh and the group as plain text, with nothing to open", () => {
    const group = { ...GROUP, earlierMentors: ["Awal Uji"] };

    const screen = screenOf({ ...STUDENT, mentorGroup: group });

    expect(screen).toContain("Pengasuh Uji Layar, M.Si.");
    expect(screen).not.toContain("<a");
    expect(screen).not.toContain("href");
  });

  it("shows the dorm, the floor and the room of a resident", () => {
    const screen = screenOf({
      ...STUDENT,
      residence: {
        dorm: "dana_rakca",
        room: {
          plotted: true,
          dorm: "dana_rakca",
          floor: 2,
          number: "204",
          asCompanion: false,
        },
      },
    });

    expect(screen).toContain(
      "<dt>Asrama</dt><dd>Asrama Dana Rakca, lantai 2, kamar 204</dd>",
    );
  });

  it("says Belum diplot for a resident who has no room yet", () => {
    const screen = screenOf({
      ...STUDENT,
      residence: { dorm: "cipta_bakti", room: { plotted: false } },
    });

    expect(screen).toContain(
      "<dt>Asrama</dt><dd>Asrama Cipta Bakti · Belum diplot</dd>",
    );
  });

  it("shows the dorm only for a resident of Asrama Wismantara", () => {
    const screen = screenOf({
      ...STUDENT,
      residence: { dorm: "wismantara_putri", room: null },
    });

    expect(screen).toContain("<dt>Asrama</dt><dd>Asrama Wismantara Putri</dd>");
  });

  it("says Non asrama for a student who lives in no dorm", () => {
    const screen = screenOf(STUDENT);

    expect(screen).toContain("<dt>Asrama</dt><dd>Non asrama</dd>");
  });

  it("puts Asrama after Jenis kelamin and Pengasuh last, as the student detail does", () => {
    const screen = screenOf({
      ...STUDENT,
      entryPath: "transfer",
      originAgency: "Direktorat Jenderal Pajak",
    });

    const titles = [...screen.matchAll(/<dt>([^<]*)<\/dt>/g)].map(
      ([, title]) => title,
    );
    expect(titles.slice(-4)).toEqual([
      "Jenis kelamin",
      "Asrama",
      "Instansi asal",
      "Pengasuh",
    ]);
  });
});

describe("OwnProfileScreen with the survey", () => {
  const SURVEY = {
    surveyPeriodId: "00000000-0000-4000-8000-000000000093",
    periodTitle: "Ganjil 2026/2027",
    endsOn: "2026-11-03",
    mentorId: "00000000-0000-4000-8000-000000000094",
    mentorName: "Pengasuh Uji Layar, M.Si.",
    sent: null,
  };

  it("puts Survei kepuasan pengasuhan above the student's record while a period is Dibuka", () => {
    const screen = renderToStaticMarkup(
      <OwnProfileScreen
        student={{ ...STUDENT, mentorGroup: GROUP }}
        period={PERIOD}
        survey={SURVEY}
      />,
    );

    const card = screen.indexOf("Survei kepuasan pengasuhan");
    expect(card).toBeGreaterThan(-1);
    expect(card).toBeLessThan(screen.indexOf("<dl"));
  });

  it("shows no survey when there is none to fill in", () => {
    expect(screenOf(STUDENT)).not.toContain("Survei kepuasan pengasuhan");
  });

  it("puts the panels it is given under the student's record and its source line", () => {
    const screen = renderToStaticMarkup(
      <OwnProfileScreen
        student={STUDENT}
        period={PERIOD}
        morePanels={<section>Panel uji capaian</section>}
      />,
    );

    const source = screen.indexOf("Data ini berasal dari data kampus.");
    expect(source).toBeGreaterThan(screen.indexOf("<dl"));
    expect(screen.indexOf("Panel uji capaian")).toBeGreaterThan(source);
  });
});
