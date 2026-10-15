import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClarificationCardView } from "./clarification-card-view";
import { TEST_CLARIFICATION } from "./test-clarifications";
import { TEST_CARD } from "./test-verification";
import { VerificationCardView } from "./verification-card-view";

const REMOVED = "Berkas sudah dihapus pada 1 Apr 2027.";

describe("a card whose file was removed as old proof", () => {
  it("shows when the photo of an attendance was removed, with its status as before", () => {
    const card = {
      ...TEST_CARD,
      status: "valid" as const,
      decidedBy: "Pegawai Uji",
      hasPhoto: false,
      removed: REMOVED,
    };

    const html = renderToStaticMarkup(<VerificationCardView card={card} />);

    expect(html).toContain(REMOVED);
    expect(html).toContain("Hadir");
    expect(html).toContain("Pegawai Uji");
    expect(html).not.toContain("<img");
  });

  it("shows when the file of a clarification was removed, in place of its name", () => {
    const card = {
      ...TEST_CLARIFICATION,
      status: "rejected" as const,
      file: null,
      removed: REMOVED,
    };

    const html = renderToStaticMarkup(
      <ClarificationCardView card={card} onOpenFile={() => {}} />,
    );

    expect(html).toContain(REMOVED);
    expect(html).toContain("Ditolak");
    expect(html).not.toContain("surat-keterangan.pdf");
  });
});
