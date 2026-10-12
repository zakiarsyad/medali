import { describe, expect, it } from "vitest";
import { objectAddress } from "./object-store";

const LOCAL = { url: "http://localhost:9000", bucket: "medali" };

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
