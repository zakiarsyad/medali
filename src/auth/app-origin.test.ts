import { describe, expect, it } from "vitest";
import { appOriginOf } from "./app-origin";

function headers(values: Record<string, string>) {
  return (name: string) => values[name] ?? null;
}

describe("appOriginOf", () => {
  it("is the address the app was opened at on a local computer", () => {
    expect(appOriginOf(headers({ host: "localhost:3000" }), "local")).toBe(
      "http://localhost:3000",
    );
  });

  it("is a secure address anywhere else when nothing says otherwise", () => {
    expect(appOriginOf(headers({ host: "medali.example" }), "campus")).toBe(
      "https://medali.example",
    );
  });

  it("takes what the server in front of the app passes on", () => {
    const passedOn = headers({
      host: "10.0.0.5:3000",
      "x-forwarded-host": "medali.example",
      "x-forwarded-proto": "https",
    });

    expect(appOriginOf(passedOn, "campus")).toBe("https://medali.example");
  });

  it("takes the first of several values passed on", () => {
    const passedOn = headers({
      "x-forwarded-host": "medali.example, dalam.example",
      "x-forwarded-proto": "https,http",
    });

    expect(appOriginOf(passedOn, "main-preview")).toBe(
      "https://medali.example",
    );
  });

  it.each([
    ["no host", {}],
    ["a host with a path", { host: "medali.example/jalan" }],
    ["a host with a name and password", { host: "a:b@medali.example" }],
    ["a host with a space", { host: "medali example" }],
    ["a host with a question mark", { host: "medali.example?x=1" }],
  ])("gives nothing for %s", (_kind, values) => {
    expect(appOriginOf(headers(values), "campus")).toBeNull();
  });

  it("ignores a way of connecting that is neither http nor https", () => {
    const passedOn = headers({
      host: "medali.example",
      "x-forwarded-proto": "javascript",
    });

    expect(appOriginOf(passedOn, "campus")).toBe("https://medali.example");
  });
});
