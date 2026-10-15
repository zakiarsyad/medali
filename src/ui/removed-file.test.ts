import { describe, expect, it } from "vitest";
import { removedFileWords } from "./removed-file";

describe("removedFileWords", () => {
  it("names the campus day the file was removed", () => {
    expect(removedFileWords(new Date("2026-10-15T18:00:00Z"))).toBe(
      "Berkas sudah dihapus pada 16 Okt 2026.",
    );
  });

  it("says nothing of a file that is not removed", () => {
    expect(removedFileWords(null)).toBeNull();
  });
});
