import { describe, expect, it } from "vitest";
import {
  explanationFault,
  isPictureName,
  keptFileName,
  pickedFileFault,
  shrunkName,
} from "./clarification-input";

const MEGABYTE = 1024 * 1024;
const TOO_SHORT = "Tulis penjelasan minimal satu kalimat.";
const MISSING = "Lampirkan dokumen pendukung.";
const WRONG_KIND = "Lampiran harus berupa PDF atau gambar.";
const TOO_LARGE = "Ukuran lampiran maksimal 5 MB.";

describe("explanationFault", () => {
  it("takes 10 to 1,000 characters", () => {
    expect(explanationFault("a".repeat(10))).toBeNull();
    expect(explanationFault("a".repeat(1000))).toBeNull();
  });

  it("refuses fewer than 10, and does not count the spaces around it", () => {
    expect(explanationFault("")).toBe(TOO_SHORT);
    expect(explanationFault("a".repeat(9))).toBe(TOO_SHORT);
    expect(explanationFault(`   ${"a".repeat(9)}   \n`)).toBe(TOO_SHORT);
  });

  it("refuses more than 1,000", () => {
    expect(explanationFault("a".repeat(1001))).toBe(
      "Penjelasan paling banyak 1.000 karakter.",
    );
    expect(explanationFault(` ${"a".repeat(1000)} `)).toBeNull();
  });
});

describe("pickedFileFault", () => {
  it.each(["surat.pdf", "SURAT.PDF", "foto.jpg", "foto.jpeg", "foto.PNG"])(
    "takes %s up to 5 MB",
    (name) => {
      expect(pickedFileFault({ name, size: 1 })).toBeNull();
      expect(pickedFileFault({ name, size: 5 * MEGABYTE })).toBeNull();
    },
  );

  it("asks for a file when none was picked, or an empty one", () => {
    expect(pickedFileFault(null)).toBe(MISSING);
    expect(pickedFileFault({ name: "surat.pdf", size: 0 })).toBe(MISSING);
  });

  it.each(["gambar.svg", "gambar.gif", "surat.docx", "surat.pdf.exe", "surat"])(
    "refuses %s: only PDF, JPG and PNG are taken",
    (name) => {
      expect(pickedFileFault({ name, size: 10 })).toBe(WRONG_KIND);
    },
  );

  it("refuses a file one byte over 5 MB", () => {
    expect(pickedFileFault({ name: "surat.pdf", size: 5 * MEGABYTE + 1 })).toBe(
      TOO_LARGE,
    );
  });
});

describe("the name of a file", () => {
  it("tells a picture from a document", () => {
    expect(isPictureName("foto.JPG")).toBe(true);
    expect(isPictureName("foto.jpeg")).toBe(true);
    expect(isPictureName("foto.png")).toBe(true);
    expect(isPictureName("surat.pdf")).toBe(false);
  });

  it("ends in .jpg once a picture was made smaller", () => {
    expect(shrunkName("surat dokter.PNG")).toBe("surat dokter.jpg");
    expect(shrunkName("foto.jpeg")).toBe("foto.jpg");
    expect(shrunkName("foto.jpg")).toBe("foto.jpg");
  });

  it("is kept without a folder before it and without letters that steer a screen", () => {
    expect(keptFileName("C:\\Users\\uji\\surat.pdf")).toBe("surat.pdf");
    expect(keptFileName("../../etc/surat.pdf")).toBe("surat.pdf");
    expect(keptFileName("surat\r\nketerangan\u0000.pdf")).toBe(
      "suratketerangan.pdf",
    );
  });

  it("is cut at the front when it is too long, so its ending stays", () => {
    const kept = keptFileName(`${"a".repeat(300)}.pdf`);

    expect(kept).toHaveLength(120);
    expect(kept.endsWith(".pdf")).toBe(true);
  });
});
