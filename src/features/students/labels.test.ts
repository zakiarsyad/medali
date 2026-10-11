import { describe, expect, it } from "vitest";
import { inputSourceLabel, uploadSource } from "./labels";

describe("inputSourceLabel", () => {
  it("names the form", () => {
    expect(inputSourceLabel("form")).toBe("Formulir");
  });

  it("names the file a student came from", () => {
    expect(inputSourceLabel(uploadSource("mahasiswa uji.csv"))).toBe(
      "Unggah mahasiswa uji.csv",
    );
  });
});
