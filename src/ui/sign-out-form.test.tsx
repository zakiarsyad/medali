import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SignOutForm } from "./sign-out-form";

describe("Keluar", () => {
  it("is a plain form sent by the browser to the sign-out address", () => {
    const form = renderToStaticMarkup(<SignOutForm />);

    expect(form).toContain('method="post"');
    expect(form).toContain('action="/keluar"');
    expect(form).toContain("Keluar");
  });

  it("makes the device forget every half-filled survey before it goes", () => {
    const code = readFileSync("src/ui/sign-out-form.tsx", "utf8");

    expect(code).toContain(
      "onSubmit={() => forgetSurveyDrafts(deviceStorage(), null)}",
    );
  });
});
