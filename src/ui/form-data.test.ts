import { describe, expect, it } from "vitest";
import { text, texts } from "./form-data";

describe("text", () => {
  it("reads a field, and reads a missing field or a file as empty", () => {
    const form = new FormData();
    form.set("name", "Budi Contoh");
    form.set("photo", new Blob(["x"]));

    expect(text(form, "name")).toBe("Budi Contoh");
    expect(text(form, "unit")).toBe("");
    expect(text(form, "photo")).toBe("");
  });
});

describe("texts", () => {
  it("reads every value of a field, without files", () => {
    const form = new FormData();
    form.append("roles", "mentor");
    form.append("roles", "assessor");
    form.append("roles", new Blob(["x"]));

    expect(texts(form, "roles")).toEqual(["mentor", "assessor"]);
    expect(texts(form, "none")).toEqual([]);
  });
});
