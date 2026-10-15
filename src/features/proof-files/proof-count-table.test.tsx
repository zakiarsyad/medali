import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import shared from "@/ui/data-screen.module.css";
import { ProofCountTable } from "./proof-count-table";
import { noCounts, PROOF_KIND_TITLES, PROOF_KINDS } from "./proof-kinds";

describe("ProofCountTable", () => {
  const html = renderToStaticMarkup(
    <ProofCountTable
      counts={{
        kept: { ...noCounts(), attendance_photo: 1250 },
        removable: { ...noCounts(), attendance_photo: 40 },
      }}
    />,
  );

  it("has one row per kind, in the order of the spec", () => {
    const shown = PROOF_KINDS.map((kind) =>
      html.indexOf(PROOF_KIND_TITLES[kind]),
    );

    expect(shown.every((at) => at >= 0)).toBe(true);
    expect([...shown].sort((a, b) => a - b)).toEqual(shown);
  });

  it("shows how many are kept and how many may go now", () => {
    expect(html).toContain('<td data-title="Disimpan">1.250</td>');
    expect(html).toContain('<td data-title="Dapat dihapus sekarang">40</td>');
  });

  it("stands as cards on a phone", () => {
    expect(shared.stacked).toMatch(/stacked/);
    expect(html).toContain(shared.stacked);
  });
});
