import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SeenStudentsDialog } from "./history-panel";
import { type SikuParams, START_PARAMS } from "./siku-address";
import type { SikuRow } from "./siku-board";
import { SikuListTable } from "./siku-list-table";
import { SikuRankingPanels } from "./siku-ranking";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const STUDENT = "00000000-0000-4000-8000-000000000301";
const ENTRY = "00000000-0000-4000-8000-000000000302";

const ROW: SikuRow = {
  id: STUDENT,
  name: "Mahasiswa Contoh",
  nim: "9964009101",
  program: "Program Contoh",
  gains: 0,
  losses: 3,
  siku: 62,
};

const PARAMS: SikuParams = { ...START_PARAMS, page: 2 };

/** The address that opens the student's detail, as the markup writes it. */
const OPENS = `href="/penilaian/siku?hal=2&amp;profil=${STUDENT}"`;

describe("names in the Penilaian SIKU lists", () => {
  it("open the student's detail from Daftar nilai SIKU, keeping the page", () => {
    const html = renderToStaticMarkup(
      <SikuListTable
        rows={[{ ...ROW, last: null }]}
        base={65}
        params={PARAMS}
      />,
    );

    expect(html).toContain(OPENS);
    expect(html).toContain("Mahasiswa Contoh");
  });

  it("open the student's detail from Perubahan nilai SIKU per mahasiswa", () => {
    const html = renderToStaticMarkup(
      <SikuRankingPanels
        ranking={{ falls: [ROW], rises: [], fallCount: 1, riseCount: 0 }}
        params={PARAMS}
        base={65}
      />,
    );

    expect(html).toContain(OPENS);
  });

  it("open the student's detail from Lihat mahasiswa, which shows again on closing", () => {
    const html = renderToStaticMarkup(
      <SeenStudentsDialog
        seen={{
          entry: {
            source: "form",
            id: ENTRY,
            day: "2026-10-13",
            kind: "loss",
            reason: "student_violation",
            points: 3,
            students: 1,
            note: "",
            basis: "",
            fromRequest: false,
            enteredBy: "Penilai Contoh",
          },
          students: [
            {
              id: STUDENT,
              studentId: STUDENT,
              name: "Mahasiswa Contoh",
              nim: "9964009101",
              program: "Program Contoh",
              change: null,
            },
          ],
          matching: 1,
          page: 1,
        }}
        params={{ ...PARAMS, seenEntry: ENTRY }}
      />,
    );

    expect(html).toContain(
      `href="/penilaian/siku?hal=2&amp;lihat=${ENTRY}&amp;profil=${STUDENT}"`,
    );
  });
});
