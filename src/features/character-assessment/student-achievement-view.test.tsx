import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentAchievement } from "./student-achievement";
import { StudentAchievementView } from "./student-achievement-view";

const STUDENT = "00000000-0000-4000-8000-000000000701";

const ASSESSED: StudentAchievement = {
  studentId: STUDENT,
  semester: 3,
  latest: {
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    source: "medali_instrument",
    fileName: null,
    enteredBy: "Penilai Contoh",
    scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
    storedRerata: 80.3,
  },
  earlier: { M: 60, E: 55, D: 70, A: 62, L: 64, I: 68 },
  mayAssess: true,
  limit: null,
};

const NOT_YET: StudentAchievement = {
  ...ASSESSED,
  latest: null,
  earlier: null,
};

function viewOf(achievement: StudentAchievement): string {
  return renderToStaticMarkup(
    <StudentAchievementView achievement={achievement} />,
  );
}

describe("Capaian karakter in a student's detail", () => {
  it("shows the medal, Rerata, predikat, source and date, the strongest and weakest value, over the dashed last one", () => {
    const html = viewOf(ASSESSED);

    expect(html).toContain("Capaian karakter semester 3");
    expect(html).toContain("Rerata 80,3");
    expect(html).toContain("Perak");
    expect(html).toContain(
      "Hasil asesmen Instrumen asesmen MEDALI 1 Okt 2026.",
    );
    expect(html).toContain("Paling menonjol pada <b>Integritas</b> (86).");
    expect(html).toContain("Perlu perhatian pada <b>Adaptif</b> (72).");
    expect(html).toContain("Garis putus-putus menunjukkan semester lalu.");
    expect(html).toMatch(/class="[^"]*medalLast/);
    expect(html).not.toContain("Input asesmen");
  });

  it("says nothing of a dashed line when there is no earlier assessment", () => {
    const html = viewOf({ ...ASSESSED, earlier: null });

    expect(html).not.toContain("Garis putus-putus");
    expect(html).not.toMatch(/class="[^"]*medalLast/);
  });

  it("says when the student is not assessed yet, with Input asesmen opening the form for them", () => {
    const html = viewOf(NOT_YET);

    expect(html).toContain("Belum diasesmen");
    expect(html).toContain(
      "Belum ada hasil asesmen karakter semester ini. Capaian MEDALI tampil setelah asesmen diinput di Penilaian &gt; Asesmen karakter.",
    );
    expect(html).toContain(
      `href="/penilaian/asesmen?mahasiswa=${STUDENT}">Input asesmen</a>`,
    );
  });

  it("offers no Input asesmen to an account that may not assess the student", () => {
    expect(viewOf({ ...NOT_YET, mayAssess: false })).not.toContain(
      "Input asesmen",
    );
  });

  it("leaves the semester out of the title when there is none to show", () => {
    const html = viewOf({ ...ASSESSED, semester: null });

    expect(html).toContain(">Capaian karakter<");
  });

  it("shows the limited scores of a student under a Ringan or Sedang penalty, saying why, with the Rerata as stored", () => {
    const html = viewOf({
      ...ASSESSED,
      latest: ASSESSED.latest && {
        ...ASSESSED.latest,
        scores: { M: 70, E: 70, D: 70, A: 70, L: 70, I: 70 },
      },
      limit: { category: "medium", level: 1 },
    });

    expect(html).toContain("Rerata 70,0");
    expect(html).toContain("Perunggu");
    expect(html).toContain(
      "Nilai semester ini dibatasi paling tinggi 70 karena hukuman disiplin sedang jenjang pertama. Rerata sebelum pembatasan 80,3.",
    );
    expect(html).not.toContain("(86)");
  });

  it("says nothing of a limit for a student without one", () => {
    expect(viewOf(ASSESSED)).not.toContain("dibatasi");
  });
});
