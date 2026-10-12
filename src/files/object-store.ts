import { AwsClient } from "aws4fetch";
import type { FileStorageSettings } from "@/settings";
import type { FileStore, StoredFile } from "./file-store";

/** A storage that does not answer in this time counts as unreachable. */
const TIMEOUT_MS = 10_000;
const NOT_FOUND = 404;
const ALREADY_THERE = 409;

type Send = (
  method: string,
  address: string,
  file?: StoredFile,
) => Promise<Response>;

/** The address of the place for files, or of one file in it. */
export function objectAddress(
  settings: Pick<FileStorageSettings, "url" | "bucket">,
  key = "",
): string {
  const base = settings.url.replace(/\/+$/, "");
  const path = [settings.bucket, ...key.split("/")]
    .filter((part) => part !== "")
    .map(encodeURIComponent)
    .join("/");
  return `${base}/${path}`;
}

function sender(settings: FileStorageSettings): Send {
  const client = new AwsClient({
    accessKeyId: settings.accessKey,
    secretAccessKey: settings.secretKey,
    service: "s3",
    // The library's ten tries would keep a person waiting for a minute.
    retries: 2,
  });
  return (method, address, file) => {
    const request: RequestInit = {
      method,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    };
    if (file) {
      // Copied, so the request holds the file's own bytes and nothing
      // else of a larger buffer they may be a view of.
      request.body = new Blob([new Uint8Array(file.bytes)]);
      request.headers = { "content-type": file.contentType };
    }
    return client.fetch(address, request);
  };
}

const KEY = /<Key>([^<]*)<\/Key>/g;
const NEXT_PAGE = /<NextContinuationToken>([^<]*)<\/NextContinuationToken>/;

export interface Listing {
  keys: string[];
  /** What to ask the next page with, or null on the last page. */
  next: string | null;
}

/**
 * Reads one page of the storage's list of keys. The keys the app makes
 * hold only letters, digits, "-" and "/", so none needs decoding.
 */
export function readListing(xml: string): Listing {
  const keys = [...xml.matchAll(KEY)].map((match) => match[1] ?? "");
  return { keys, next: xml.match(NEXT_PAGE)?.[1] ?? null };
}

function listAddress(
  settings: FileStorageSettings,
  prefix: string,
  page: string | null,
): string {
  const query = new URLSearchParams({ "list-type": "2", prefix });
  if (page) query.set("continuation-token", page);
  return `${objectAddress(settings)}?${query}`;
}

async function listKeys(
  settings: FileStorageSettings,
  send: Send,
  prefix: string,
): Promise<string[]> {
  const keys: string[] = [];
  let page: string | null = null;
  do {
    const response = await send("GET", listAddress(settings, prefix, page));
    if (!response.ok) throw refused("GET", response);
    const listing = readListing(await response.text());
    keys.push(...listing.keys);
    page = listing.next;
  } while (page);
  return keys;
}

/** Fails without the address or the answer's text: either may name a file. */
function refused(method: string, response: Response): Error {
  return new Error(
    `The file storage answered ${response.status} to ${method}.`,
  );
}

/** The file storage itself: MinIO, or a service that works like it. */
export function objectStore(settings: FileStorageSettings): FileStore {
  const send = sender(settings);
  return {
    async put(key, file) {
      const response = await send("PUT", objectAddress(settings, key), file);
      if (!response.ok) throw refused("PUT", response);
    },
    async get(key) {
      const response = await send("GET", objectAddress(settings, key));
      if (response.status === NOT_FOUND) return null;
      if (!response.ok) throw refused("GET", response);
      return new Uint8Array(await response.arrayBuffer());
    },
    async remove(key) {
      const response = await send("DELETE", objectAddress(settings, key));
      if (!response.ok && response.status !== NOT_FOUND) {
        throw refused("DELETE", response);
      }
    },
    list: (prefix) => listKeys(settings, send, prefix),
  };
}

/** Makes the place for files, unless it is already there. */
export async function ensureBucket(
  settings: FileStorageSettings,
): Promise<"made" | "already-there"> {
  const response = await sender(settings)("PUT", objectAddress(settings));
  if (response.ok) return "made";
  if (response.status === ALREADY_THERE) return "already-there";
  throw refused("PUT", response);
}
