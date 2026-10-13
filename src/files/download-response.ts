import { JPEG, PDF, PNG } from "./file-kinds";

/** A kept file as it is sent back to the person who may open it. */
export interface Download {
  name: string;
  contentType: string;
  bytes: Uint8Array;
}

export type Refusal =
  | "not-signed-in"
  | "not-allowed"
  | "not-found"
  | "unreachable";

const REFUSALS: Record<Refusal, { status: number; says: string }> = {
  "not-signed-in": { status: 401, says: "Masuk dulu untuk membuka berkas." },
  "not-allowed": { status: 403, says: "Anda tidak berhak membuka berkas ini." },
  "not-found": { status: 404, says: "Berkas tidak ditemukan." },
  unreachable: { status: 503, says: "Berkas tidak dapat dibuka. Coba lagi." },
};

const FALLBACK_NAME = "berkas";
const NOT_PLAIN = /[^A-Za-z0-9._-]/g;
/** What `encodeURIComponent` leaves alone but a header value may not hold. */
const NOT_HEADER_SAFE = /['()*]/g;

function percentCode(character: string): string {
  return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
}

/**
 * Tells the browser to save the file under its own name, never to show
 * it. The name comes from outside, so it is written twice: once with
 * plain letters only, for old browsers, and once in full, encoded so no
 * character of it can end the header or start another.
 */
export function attachmentHeader(name: string): string {
  const plain = name.replace(NOT_PLAIN, "_") || FALLBACK_NAME;
  const full = encodeURIComponent(name).replace(NOT_HEADER_SAFE, percentCode);
  return `attachment; filename="${plain}"; filename*=UTF-8''${full}`;
}

/**
 * The answer that downloads a file, bytes unchanged. Kept files are
 * private: no browser or server in between may keep a copy, and the
 * browser may not guess another type than the one named.
 */
export function downloadResponse(file: Download): Response {
  return fileResponse(file, attachmentHeader(file.name));
}

function fileResponse(file: Download, disposition: string): Response {
  return new Response(new Blob([new Uint8Array(file.bytes)]), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.bytes.length),
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * The kinds a browser may show inside a page of the app: a PDF and the
 * two kinds of picture that hold no code. Anything else, such as a page
 * or a drawing with code in it, would run as part of the app.
 */
const SHOWN_IN_PAGE: readonly string[] = [
  PDF.contentType,
  JPEG.contentType,
  PNG.contentType,
];

/**
 * The answer that lets a page of the app show a file, bytes unchanged
 * and as private as a download. A file of a kind that is not safe to
 * show is downloaded instead.
 */
export function viewResponse(file: Download): Response {
  if (!SHOWN_IN_PAGE.includes(file.contentType)) return downloadResponse(file);
  const saved = attachmentHeader(file.name);
  return fileResponse(file, saved.replace(/^attachment/, "inline"));
}

/** The answer to a download that is refused, with no detail of the file. */
export function refusalResponse(refusal: Refusal): Response {
  const { status, says } = REFUSALS[refusal];
  return new Response(says, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
