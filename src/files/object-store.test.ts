import { describe, expect, it } from "vitest";
import { objectAddress, readListing } from "./object-store";

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
});
