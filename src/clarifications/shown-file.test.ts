import { describe, expect, it } from "vitest";
import { fileFacts, isPdfType, shownFileOf } from "./shown-file";

describe("fileFacts", () => {
  it("says the kind and the size in KB, a small file counting as 1 KB", () => {
    expect(fileFacts(true, 20_480)).toBe("Dokumen PDF · 20 KB");
    expect(fileFacts(false, 64)).toBe("Gambar · 1 KB");
    expect(fileFacts(true, 5 * 1024 * 1024)).toBe("Dokumen PDF · 5.120 KB");
  });

  it("takes only a PDF as a document", () => {
    expect(isPdfType("application/pdf")).toBe(true);
    expect(isPdfType("image/png")).toBe(false);
  });
});

describe("shownFileOf", () => {
  it("names a kept file with its kind and size", () => {
    expect(
      shownFileOf({
        fileName: "surat.jpg",
        fileContentType: "image/jpeg",
        fileSize: 2048,
      }),
    ).toEqual({ name: "surat.jpg", isPdf: false, facts: "Gambar · 2 KB" });
  });
});
