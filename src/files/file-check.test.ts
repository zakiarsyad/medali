import { describe, expect, it } from "vitest";
import { type FileRule, fileFault, kindOf, shapeFault } from "./file-check";
import { CSV } from "./file-kinds";

const RULE: FileRule = { kinds: [CSV], maxBytes: 100 };
const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function text(content: string): Uint8Array {
  return new TextEncoder().encode(content);
}

describe("kindOf", () => {
  it("tells the kind by the end of the name, in any letter case", () => {
    expect(kindOf("daftar.csv", RULE)).toBe(CSV);
    expect(kindOf("DAFTAR.CSV", RULE)).toBe(CSV);
  });

  it.each(["daftar.xlsx", "daftar.csv.exe", "daftar", "csv"])(
    "finds no kind for %s",
    (name) => {
      expect(kindOf(name, RULE)).toBeNull();
    },
  );

  it("finds no kind when the rule takes none", () => {
    expect(kindOf("daftar.csv", { kinds: [], maxBytes: 100 })).toBeNull();
  });
});

describe("shapeFault", () => {
  it("accepts a file of an allowed kind up to the largest size", () => {
    expect(shapeFault("daftar.csv", 1, RULE)).toBeNull();
    expect(shapeFault("daftar.csv", 100, RULE)).toBeNull();
  });

  it("refuses a kind the rule does not take", () => {
    expect(shapeFault("foto.png", 10, RULE)).toBe("wrong-kind");
  });

  it("refuses an empty file", () => {
    expect(shapeFault("daftar.csv", 0, RULE)).toBe("empty");
  });

  it("refuses a file one byte over the largest size", () => {
    expect(shapeFault("daftar.csv", 101, RULE)).toBe("too-large");
  });
});

describe("fileFault", () => {
  it("accepts a file that holds what its name says", () => {
    const file = { name: "daftar.csv", bytes: text("nim,nama\n1,Uji\n") };

    expect(fileFault(file, RULE)).toBeNull();
  });

  it("refuses a picture renamed to .csv", () => {
    const file = { name: "foto.csv", bytes: new Uint8Array(PNG_START) };

    expect(fileFault(file, RULE)).toBe("wrong-content");
  });

  it("refuses a spreadsheet renamed to .csv", () => {
    const bytes = new Uint8Array([80, 75, 3, 4, 0, 0, 0, 0]);

    expect(fileFault({ name: "daftar.csv", bytes }, RULE)).toBe(
      "wrong-content",
    );
  });

  it("refuses by name and size before it looks inside", () => {
    const tooLarge = { name: "daftar.csv", bytes: text("a".repeat(101)) };

    expect(fileFault({ name: "foto.png", bytes: text("a") }, RULE)).toBe(
      "wrong-kind",
    );
    expect(fileFault(tooLarge, RULE)).toBe("too-large");
  });
});
