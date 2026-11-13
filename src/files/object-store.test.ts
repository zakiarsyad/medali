import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { objectAddress, objectStore, readListing } from "./object-store";

const LOCAL = { url: "http://localhost:9000", bucket: "medali" };

describe("readListing", () => {
  it("reads the keys of the last page", () => {
    const xml =
      "<ListBucketResult><IsTruncated>false</IsTruncated>" +
      "<Contents><Key>pr-previews/student-files/a</Key><Size>1</Size></Contents>" +
      "<Contents><Key>pr-previews/student-files/b</Key></Contents>" +
      "</ListBucketResult>";

    expect(readListing(xml)).toEqual({
      keys: ["pr-previews/student-files/a", "pr-previews/student-files/b"],
      next: null,
    });
  });

  it("says what to ask the next page with when there is one", () => {
    const xml =
      "<ListBucketResult><IsTruncated>true</IsTruncated>" +
      "<Contents><Key>pr-previews/a</Key></Contents>" +
      "<NextContinuationToken>lanjut-1</NextContinuationToken>" +
      "</ListBucketResult>";

    expect(readListing(xml)).toEqual({
      keys: ["pr-previews/a"],
      next: "lanjut-1",
    });
  });

  it("reads an empty list", () => {
    expect(readListing("<ListBucketResult></ListBucketResult>")).toEqual({
      keys: [],
      next: null,
    });
  });
});

describe("objectAddress", () => {
  it("puts the place for files and the key after the storage address", () => {
    expect(objectAddress(LOCAL, "uji/abc")).toBe(
      "http://localhost:9000/medali/uji/abc",
    );
  });

  it("gives the place for files itself when no key is named", () => {
    expect(objectAddress(LOCAL)).toBe("http://localhost:9000/medali");
  });

  it("does not double the slash of an address that ends with one", () => {
    expect(
      objectAddress({ ...LOCAL, url: "http://localhost:9000/" }, "a"),
    ).toBe("http://localhost:9000/medali/a");
  });

  it("keeps a key with unusual characters inside its own part of the address", () => {
    expect(objectAddress(LOCAL, "uji/a b?c#d")).toBe(
      "http://localhost:9000/medali/uji/a%20b%3Fc%23d",
    );
  });

  it.each(["local/../main-preview/a", "../a", "uji/./a", "uji/.."])(
    "refuses the key %s, which would step out of its own part",
    (key) => {
      expect(() => objectAddress(LOCAL, key)).toThrow(
        "A key of the file storage may not hold",
      );
    },
  );
});

/**
 * Behaves like the fetch of the running Next.js server, which rebuilds a
 * request it is handed from the request's body stream, losing its size.
 */
function nextLikeFetch(realFetch: typeof fetch): typeof fetch {
  return (input, init) => {
    if (input instanceof Request) {
      return realFetch(
        new Request(input.url, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          duplex: "half",
        } as RequestInit),
      );
    }
    return realFetch(input, init);
  };
}

/** A storage that keeps the headers of each request and answers 200. */
async function headerKeeper() {
  const received: IncomingHttpHeaders[] = [];
  const server = createServer((request, response) => {
    received.push(request.headers);
    request.resume();
    request.on("end", () => response.end());
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, received, server };
}

describe("objectStore put", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("states the file's exact size, even where fetch rebuilds the request", async () => {
    const storage = await headerKeeper();
    vi.stubGlobal("fetch", nextLikeFetch(fetch));
    const bytes = new TextEncoder().encode("nim,nama\n1,Contoh\n");

    try {
      await objectStore({
        url: storage.url,
        bucket: "medali",
        accessKey: "uji",
        secretKey: "uji-rahasia",
      }).put("uji/berkas", { bytes, contentType: "text/csv" });
    } finally {
      storage.server.close();
    }

    expect(storage.received).toHaveLength(1);
    expect(storage.received[0]?.["content-length"]).toBe(
      String(bytes.byteLength),
    );
    expect(storage.received[0]?.["transfer-encoding"]).toBeUndefined();
  });
});
