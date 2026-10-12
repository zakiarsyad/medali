import { describe, expect, it } from "vitest";
import {
  checkNamesItsDatabase,
  databaseNameOf,
  pointsAtThisComputer,
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

  it("is empty when the address names no database", () => {
    expect(databaseNameOf("postgres://medali@localhost:5432")).toBe("");
  });
});

describe("checkNamesItsDatabase", () => {
  it.each([[LOCAL], [`${LOCAL}?sslmode=disable`]])("allows %s", (url) => {
    expect(() => checkNamesItsDatabase("DATABASE_URL", url)).not.toThrow();
  });

  it.each([
    ["postgres://medali@localhost:5432"],
    ["postgres://medali@localhost:5432/"],
    [`${LOCAL}?database=other`],
  ])("refuses %s", (url) => {
    expect(() => checkNamesItsDatabase("DATABASE_URL", url)).toThrow(
      /DATABASE_URL must end with the name/,
    );
  });
});
