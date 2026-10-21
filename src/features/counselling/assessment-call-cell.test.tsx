import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AssessmentCallCell } from "./assessment-call-cell";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("./assessment-call-actions", () => ({
  callFromAssessmentAction: vi.fn(),
}));

const STUDENT = "00000000-0000-4000-8000-000000000601";

function cell(call: Parameters<typeof AssessmentCallCell>[0]["call"]) {
  return renderToStaticMarkup(
    <AssessmentCallCell studentId={STUDENT} name="Ani Contoh" call={call} />,
  );
}

describe("Konseling of a row of Teridentifikasi perlu pembinaan", () => {
  it("offers Panggil konseling while the student has no call this period", () => {
    const html = cell(undefined);

    expect(html).toContain(">Panggil konseling</button>");
  });

  it("shows the status instead of the button, with no time before Konselor set one", () => {
    const html = cell({ status: "awaiting", day: null, hour: null });

    expect(html).toContain("Menunggu jadwal");
    expect(html).not.toContain("Panggil konseling");
    expect(html).not.toContain("pukul");
  });

  it("shows the date and Jam once Konselor set them", () => {
    const html = cell({
      status: "scheduled",
      day: "2026-10-26",
      hour: "10:00",
    });

    expect(html).toContain("Dijadwalkan");
    expect(html).toContain("26 Okt 2026 pukul 10:00");
  });
});
