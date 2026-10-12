import { describe, expect, it } from "vitest";
import {
  databaseNameOf,
  pointsAtThisComputer,
  sameDatabase,
} from "./database-address";

const LOCAL = "postgres://medali@localhost:5432/medali";

describe("pointsAtThisComputer", () => {
  it.each([[LOCAL], ["postgres://medali@127.0.0.1:5432/medali"]])(
    "is true for %s",
    (url) => {
      expect(pointsAtThisComputer(url)).toBe(true);
    },
  );

  it.each([
    ["postgres://u@db.example.com/medali"],
    ["postgres://u@localhost.example.com/medali"],
    ["not a url"],
    [""],
    [undefined],
  ])("is false for %s", (url) => {
    expect(pointsAtThisComputer(url)).toBe(false);
  });
});

describe("databaseNameOf", () => {
  it("is the name after the server, without what follows it", () => {
    expect(databaseNameOf(`${LOCAL}_126?sslmode=disable`)).toBe("medali_126");
  });
});

describe("sameDatabase", () => {
  it.each([
    [LOCAL],
    ["postgres://medali@127.0.0.1:5432/medali"],
    ["postgres://other@localhost/medali"],
  ])("is true for the local database and %s", (url) => {
    expect(sameDatabase(LOCAL, url)).toBe(true);
  });

  it.each([
    ["postgres://medali@localhost:5432/medali_test", "another name"],
    ["postgres://medali@localhost:5433/medali", "another port"],
    ["postgres://medali@db.example.com:5432/medali", "another server"],
    ["not a url", "no address"],
  ])("is false for the local database and %s: %s", (url, _kind) => {
    expect(sameDatabase(LOCAL, url)).toBe(false);
  });
});
