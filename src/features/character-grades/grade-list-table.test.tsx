import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { START_PARAMS } from "./grade-address";
import { type GradeInput, gradeRowOf } from "./grade-list";
import { GradeListTable, NO_GRADE_MATCHES } from "./grade-list-table";
import { STARTING_SCHEME } from "./scheme-ids";

const ANI: GradeInput = {
  student: {
    id: "id-ani",
    name: "Ani Uji Daftar",
    nim: "9987100301",
    program: "Prodi Uji",
  },
  attendance: { percent: 87.5, attended: 7, counted: 8 },
  mentoring: 80,
  siku: { score: 68, adjusted: true, note: "SIKU 65 +5 / −2" },
  skpm: 72,
};

const BUDI: GradeInput = {
  student: { ...ANI.student, id: "id-budi", name: "Budi Uji Daftar" },
  attendance: { percent: null, attended: 0, counted: 0 },
  mentoring: null,
  siku: { score: 65, adjusted: false, note: "SIKU dasar 65" },
  skpm: null,
};

function pageOf(inputs: GradeInput[]): string {
  const rows = inputs.map((input) => gradeRowOf(input, STARTING_SCHEME));
  return renderToStaticMarkup(
    <GradeListTable rows={rows} params={START_PARAMS} />,
  );
}

describe("Daftar nilai karakter", () => {
  it("shows each part, Kehadiran with attended of counted, Nilai akhir, Huruf and Keterangan", () => {
    const page = pageOf([ANI]);

    for (const words of [
      "87,5",
      "7/8",
      'data-title="Pengasuhan">80<',
      'data-title="SIKU">68<',
      'data-title="SKPM">72,0<',
      // 87.5, 80, 68 and 72 with 25% each is 76.875.
      "76,9",
      ">B<",
      "(Lulus)",
      "SIKU 65 +5 / −2",
    ]) {
      expect(page).toContain(words);
    }
  });

  it("writes Kehadiran and SKPM with one decimal, also when they are whole", () => {
    const page = pageOf([
      {
        ...ANI,
        attendance: { percent: 80, attended: 8, counted: 10 },
        skpm: 0,
      },
      {
        ...ANI,
        student: { ...ANI.student, id: "id-cici" },
        attendance: { percent: 100, attended: 4, counted: 4 },
        skpm: 100,
      },
      {
        ...ANI,
        student: { ...ANI.student, id: "id-dodi" },
        attendance: { percent: 0, attended: 0, counted: 3 },
        skpm: 66.7,
      },
    ]);

    for (const words of [
      'data-title="Kehadiran">80,0<',
      "8/10",
      'data-title="Kehadiran">100,0<',
      'data-title="Kehadiran">0,0<',
      "0/3",
      'data-title="SKPM">0,0<',
      'data-title="SKPM">100,0<',
      'data-title="SKPM">66,7<',
    ]) {
      expect(page).toContain(words);
    }
  });

  it("keeps Pengasuhan and SIKU whole", () => {
    const page = pageOf([
      { ...ANI, mentoring: 72, siku: { ...ANI.siku, score: 65 } },
    ]);

    expect(page).toContain('data-title="Pengasuhan">72<');
    expect(page).toContain('data-title="SIKU">65<');
  });

  it("shows a dash for each missing part and Belum lengkap for the grade", () => {
    const page = pageOf([BUDI]);

    expect(page).toContain("Belum lengkap");
    expect(page).toContain("SIKU dasar 65");
    expect(page.match(/>-</g)).toHaveLength(4);
  });

  it("gives every value the title it stands beside on a phone", () => {
    const page = pageOf([ANI]);

    for (const title of [
      "Mahasiswa",
      "Kehadiran",
      "Pengasuhan",
      "SIKU",
      "SKPM",
      "Nilai akhir",
      "Huruf",
      "Keterangan",
    ]) {
      expect(page).toContain(`data-title="${title}"`);
    }
  });

  it("says so when no student matches", () => {
    expect(pageOf([])).toContain(NO_GRADE_MATCHES);
  });
});

describe("names in Daftar nilai karakter", () => {
  it("open the student's profile over the tab, keeping the page", () => {
    const rows = [gradeRowOf(ANI, STARTING_SCHEME)];
    const html = renderToStaticMarkup(
      <GradeListTable rows={rows} params={{ ...START_PARAMS, page: 2 }} />,
    );

    expect(html).toContain(
      'href="/penilaian/karakter?hal=2&amp;profil=id-ani"',
    );
  });
});
