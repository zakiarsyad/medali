import { describe, expect, it } from "vitest";
import { JPEG, PDF, PNG } from "./file-kinds";

const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_START = [0xff, 0xd8, 0xff, 0xe0, 0x00];

function text(content: string): number[] {
  return [...new TextEncoder().encode(content)];
}

describe("JPEG", () => {
  it("holds bytes that start as a JPEG picture does", () => {
    expect(JPEG.holds(new Uint8Array(JPEG_START))).toBe(true);
  });

  it.each([
    ["a PNG picture", [0x89, 0x50, 0x4e, 0x47]],
    ["text", text("nim,nama")],
    ["a start cut short", [0xff, 0xd8]],
    ["nothing", []],
  ])("does not hold %s", (_kind, bytes) => {
    expect(JPEG.holds(new Uint8Array(bytes))).toBe(false);
  });
});

describe("PNG", () => {
  it("holds bytes that start as a PNG picture does", () => {
    expect(PNG.holds(new Uint8Array([...PNG_START, 0x00]))).toBe(true);
    expect(PNG.contentType).toBe("image/png");
  });

  it.each([
    ["a JPEG picture", JPEG_START],
    ["a PDF document", text("%PDF-1.4")],
    ["a drawing that can carry code", text("<svg xmlns=")],
    ["a start cut short", PNG_START.slice(0, 7)],
    ["nothing", []],
  ])("does not hold %s", (_kind, bytes) => {
    expect(PNG.holds(new Uint8Array(bytes))).toBe(false);
  });
});

describe("PDF", () => {
  it("holds bytes that start as a PDF document does", () => {
    expect(PDF.holds(new Uint8Array(text("%PDF-1.4\n")))).toBe(true);
    expect(PDF.contentType).toBe("application/pdf");
  });

  it.each([
    ["a JPEG picture", JPEG_START],
    ["a PNG picture", PNG_START],
    ["a page that can carry code", text("<html><script>")],
    ["text that names a PDF later", text("lihat %PDF-1.4")],
    ["a start cut short", text("%PDF")],
    ["nothing", []],
  ])("does not hold %s", (_kind, bytes) => {
    expect(PDF.holds(new Uint8Array(bytes))).toBe(false);
  });
});
