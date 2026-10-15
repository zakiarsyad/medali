import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { noCounts } from "./proof-kinds";
import { RemoveOldButton } from "./remove-old-button";

function buttonOf(page: string): string {
  return page.match(/<button[^>]*>Hapus berkas lama<\/button>/)?.[0] ?? "";
}

describe("Hapus berkas lama", () => {
  it("is on with days set and files that may go", () => {
    const page = renderToStaticMarkup(
      <RemoveOldButton
        removable={{ ...noCounts(), siku_photo: 2 }}
        isSet={true}
      />,
    );

    expect(buttonOf(page)).not.toBe("");
    expect(buttonOf(page)).not.toContain("disabled");
  });

  it("is off while the days are not set", () => {
    const page = renderToStaticMarkup(
      <RemoveOldButton
        removable={{ ...noCounts(), siku_photo: 2 }}
        isSet={false}
      />,
    );

    expect(buttonOf(page)).toContain("disabled");
  });

  it("is off with nothing that may go", () => {
    const page = renderToStaticMarkup(
      <RemoveOldButton removable={noCounts()} isSet={true} />,
    );

    expect(buttonOf(page)).toContain("disabled");
  });
});
