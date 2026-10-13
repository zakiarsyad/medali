import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GroupHeadActions } from "./group-head-actions";

const EVALUATE = "/pengasuh/ganti?kelompok=uji";
const REPLACE = "/pengasuh/ganti?bagian=penggantian&kelompok=uji";

function shown(evaluate: string | null, replace: string | null): string {
  return renderToStaticMarkup(
    <GroupHeadActions evaluateAddress={evaluate} replaceAddress={replace} />,
  );
}

describe("GroupHeadActions", () => {
  it("shows Ganti pengasuh beside Evaluasi pengasuh, each opening its form", () => {
    const screen = shown(EVALUATE, REPLACE);

    expect(screen).toMatch(
      /href="\/pengasuh\/ganti\?kelompok=uji"[^>]*>Evaluasi pengasuh<\/a>/,
    );
    expect(screen).toMatch(
      /href="\/pengasuh\/ganti\?bagian=penggantian&amp;kelompok=uji"[^>]*>Ganti pengasuh<\/a>/,
    );
  });

  it("shows nothing to an account that may neither evaluate nor replace", () => {
    expect(shown(null, null)).toBe("");
  });

  it("shows no Ganti pengasuh without its address", () => {
    expect(shown(EVALUATE, null)).not.toContain("Ganti pengasuh");
  });
});
