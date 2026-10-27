import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ScreenFault from "./(app)/error";
import GlobalFault from "./global-error";

vi.mock("@/ui/brand-font", () => ({
  brandFont: { variable: "brand-font" },
}));

const fault = Object.assign(new Error("relation accounts does not exist"), {
  digest: "4127793311",
});

const MESSAGE = "Coba lagi, atau kembali ke halaman utama.";

describe("a screen that cannot load", () => {
  const html = renderToStaticMarkup(
    <ScreenFault error={fault} retry={() => {}} />,
  );

  it("says the page could not be shown, in Bahasa Indonesia", () => {
    expect(html).toContain("Halaman tidak dapat ditampilkan");
    expect(html).toContain(MESSAGE);
  });

  it('offers "Coba lagi" and a way back to the home page', () => {
    expect(html).toMatch(/<button[^>]*>Coba lagi<\/button>/);
    expect(html).toMatch(/<a href="\/"[^>]*>Kembali ke halaman utama<\/a>/);
  });

  it("never shows the fault's own detail", () => {
    expect(html).not.toContain(fault.message);
    expect(html).not.toContain(fault.digest);
  });

  it("is drawn inside the menu, without a page of its own", () => {
    expect(html).not.toContain("<html");
  });
});

describe("the whole app when it cannot load", () => {
  const html = renderToStaticMarkup(
    <GlobalFault error={fault} retry={() => {}} />,
  );

  it("shows the same message on a page of its own, in the app's font", () => {
    expect(html).toMatch(/<html lang="id" class="brand-font">/);
    expect(html).toContain("<body>");
    expect(html).toContain("Halaman tidak dapat ditampilkan");
    expect(html).toContain(MESSAGE);
    expect(html).toMatch(/<button[^>]*>Coba lagi<\/button>/);
    expect(html).toMatch(/<a href="\/"[^>]*>Kembali ke halaman utama<\/a>/);
  });

  it("never shows the fault's own detail", () => {
    expect(html).not.toContain(fault.message);
    expect(html).not.toContain(fault.digest);
  });
});
