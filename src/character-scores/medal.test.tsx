import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Medal } from "./medal";

const AVERAGES = { M: 80.4, E: 77.5, D: 84, A: 72.6, L: 82, I: 86 };

describe("Medal", () => {
  it("shows an average at each corner to the whole number", () => {
    const html = renderToStaticMarkup(<Medal scores={AVERAGES} last={null} />);

    expect(html).toContain(
      "Grafik nilai MEDALI: Mandiri 80, Empati 78, Disiplin 84, Adaptif 73, Loyal 82, Integritas 86",
    );
    expect(html).not.toContain("80.4");
  });

  it("draws the assessment before as a dashed line only when there is one", () => {
    const without = renderToStaticMarkup(
      <Medal scores={AVERAGES} last={null} />,
    );
    const withLast = renderToStaticMarkup(
      <Medal scores={AVERAGES} last={AVERAGES} />,
    );

    expect(without).not.toMatch(/class="[^"]*medalLast/);
    expect(withLast).toMatch(/class="[^"]*medalLast/);
  });
});
