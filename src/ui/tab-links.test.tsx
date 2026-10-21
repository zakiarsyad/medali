import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyPage } from "./empty-page";
import { TabLinks } from "./tab-links";

const kesehatan = { path: "kesehatan", title: "Kesehatan" };
const kamar = { path: "kamar", title: "Kamar" };

describe("the row of tabs", () => {
  it("is not drawn when the role may open only one tab", () => {
    const html = renderToStaticMarkup(
      <TabLinks pagePath="asrama" tabs={[kesehatan]} open="kesehatan" />,
    );

    expect(html).toBe("");
  });

  it("is drawn with every tab when the role may open two tabs", () => {
    const html = renderToStaticMarkup(
      <TabLinks pagePath="asrama" tabs={[kamar, kesehatan]} open="kamar" />,
    );

    expect(html).toContain('aria-label="Bagian halaman"');
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).toContain('href="/asrama/kamar"');
    expect(html).toContain('href="/asrama/kesehatan"');
  });

  it("is not drawn on a page not built yet with one tab", () => {
    const html = renderToStaticMarkup(
      <EmptyPage
        title="Asrama"
        tabs={{ pagePath: "asrama", tabs: [kesehatan], open: "kesehatan" }}
      />,
    );

    expect(html).toContain("Asrama");
    expect(html).toContain('aria-label="Isi halaman"');
    expect(html).not.toContain("Bagian halaman");
  });
});
