import { describe, expect, it } from "vitest";
import {
  attachmentHeader,
  downloadResponse,
  refusalResponse,
  viewResponse,
} from "./download-response";

describe("attachmentHeader", () => {
  it("names an ordinary file as it is", () => {
    expect(attachmentHeader("mahasiswa-baru_2026.csv")).toBe(
      "attachment; filename=\"mahasiswa-baru_2026.csv\"; filename*=UTF-8''mahasiswa-baru_2026.csv",
    );
  });

  it("encodes spaces and letters outside the plain ones", () => {
    expect(attachmentHeader("daftar élan 2026.csv")).toBe(
      "attachment; filename=\"daftar__lan_2026.csv\"; filename*=UTF-8''daftar%20%C3%A9lan%202026.csv",
    );
  });

  it("lets no character of a name end the header or start another", () => {
    const header = attachmentHeader("a\"; x=1\r\nSet-Cookie: b=(c)*'.csv");

    expect(header).toBe(
      "attachment; filename=\"a___x_1__Set-Cookie__b__c___.csv\"; filename*=UTF-8''a%22%3B%20x%3D1%0D%0ASet-Cookie%3A%20b%3D%28c%29%2A%27.csv",
    );
  });

  it("still names a file whose name is empty", () => {
    expect(attachmentHeader("")).toBe(
      "attachment; filename=\"berkas\"; filename*=UTF-8''",
    );
  });
});

describe("downloadResponse", () => {
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 110, 105, 109, 13, 10, 49]);
  const file = {
    name: "daftar.csv",
    contentType: "text/csv; charset=utf-8",
    bytes,
  };

  it("sends the bytes unchanged", async () => {
    const response = downloadResponse(file);

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("is saved, never shown, and never kept by anyone in between", () => {
    const { headers } = downloadResponse(file);

    expect(headers.get("Content-Disposition")).toMatch(/^attachment; /);
    expect(headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(headers.get("Content-Length")).toBe("9");
    expect(headers.get("Cache-Control")).toBe("private, no-store");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("viewResponse", () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

  it.each(["application/pdf", "image/jpeg", "image/png"])(
    "lets a page show a file of the kind %s, as private as a download",
    async (contentType) => {
      const response = viewResponse({
        name: "surat (1).pdf",
        contentType,
        bytes,
      });
      const { headers } = response;

      expect(headers.get("Content-Disposition")).toBe(
        "inline; filename=\"surat__1_.pdf\"; filename*=UTF-8''surat%20%281%29.pdf",
      );
      expect(headers.get("Content-Type")).toBe(contentType);
      expect(headers.get("Cache-Control")).toBe("private, no-store");
      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    },
  );

  it.each([
    "text/html",
    "image/svg+xml",
    "text/csv; charset=utf-8",
    "application/pdf; charset=utf-8",
    "",
  ])("downloads a file of the kind %j instead of showing it", (contentType) => {
    const { headers } = viewResponse({ name: "berkas", contentType, bytes });

    expect(headers.get("Content-Disposition")).toMatch(/^attachment; /);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("refusalResponse", () => {
  it.each([
    ["not-signed-in", 401],
    ["not-allowed", 403],
    ["not-found", 404],
    ["unreachable", 503],
  ] as const)("answers %s with %i and nothing of a file", (refusal, status) => {
    const response = refusalResponse(refusal);

    expect(response.status).toBe(status);
    expect(response.headers.get("Content-Disposition")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
