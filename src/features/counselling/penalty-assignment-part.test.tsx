import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PenaltyAssignmentPart } from "./penalty-assignment-part";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("./penalty-assignment-actions", () => ({
  assignFromPenaltyAction: vi.fn(),
}));

const PENALTY = "00000000-0000-4000-8000-000000000684";

describe("Tugaskan konseling wajib in Rincian of a penalty", () => {
  it("offers the message and the button while the penalty has no Penugasan", () => {
    const html = renderToStaticMarkup(
      <PenaltyAssignmentPart penaltyId={PENALTY} name="Ani Contoh" box={null} />,
    );

    expect(html).toContain("Tugaskan konseling wajib</h3>");
    expect(html).toContain("Pesan untuk konselor (opsional)");
    expect(html).toContain('maxLength="500"');
    expect(html).toContain(">Tugaskan konseling</button>");
  });

  it("shows how it stands instead of the button once there is one", () => {
    const html = renderToStaticMarkup(
      <PenaltyAssignmentPart
        penaltyId={PENALTY}
        name="Ani Contoh"
        box={<p>Kotak status uji</p>}
      />,
    );

    expect(html).toContain("Kotak status uji");
    expect(html).not.toContain("Tugaskan konseling");
    expect(html).not.toContain("<input");
  });
});
