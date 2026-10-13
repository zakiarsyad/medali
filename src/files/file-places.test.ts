import { describe, expect, it } from "vitest";
import {
  FILE_PLACES,
  filePlaceOf,
  inPlace,
  makesOwnPlace,
  placePrefix,
} from "./file-places";
import { memoryStore } from "./memory-store";

const FILE = { bytes: new Uint8Array([1, 2, 3]), contentType: "text/csv" };

describe("makesOwnPlace", () => {
  it.each(["local", "campus"] as const)(
    "lets %s make the place for files: the file storage is its own",
    (stage) => {
      expect(makesOwnPlace(stage)).toBe(true);
    },
  );

  it.each(["pr-preview", "main-preview"] as const)(
    "does not let %s make it: at the previews' service it is made by hand",
    (stage) => {
      expect(makesOwnPlace(stage)).toBe(false);
    },
  );
});

describe("filePlaceOf", () => {
  it("keeps the files of PR previews apart from those of the preview of main", () => {
    expect(filePlaceOf("pr-preview")).toBe("pr-previews");
    expect(filePlaceOf("main-preview")).toBe("main-preview");
    expect(filePlaceOf("pr-preview")).not.toBe(filePlaceOf("main-preview"));
  });

  it("gives every kind of environment its own place", () => {
    const places = Object.values(FILE_PLACES);

    expect(new Set(places).size).toBe(places.length);
  });

  it("gives no place a name that another place's keys start with", () => {
    const prefixes = Object.values(FILE_PLACES).map(placePrefix);
    for (const prefix of prefixes) {
      const startingWith = prefixes.filter((other) => other.startsWith(prefix));
      expect(startingWith).toEqual([prefix]);
    }
  });
});

describe("inPlace", () => {
  it("keeps a file inside its place, and gives it back by the same key", async () => {
    const store = memoryStore();
    const place = inPlace(store, "pr-previews");

    await place.put("student-files/a", FILE);

    expect([...store.files.keys()]).toEqual(["pr-previews/student-files/a"]);
    expect(await place.get("student-files/a")).toEqual(FILE.bytes);
  });

  it("does not see or remove the file another place keeps under the same key", async () => {
    const store = memoryStore();
    const prPreviews = inPlace(store, "pr-previews");
    await inPlace(store, "main-preview").put("student-files/a", FILE);

    await prPreviews.remove("student-files/a");

    expect(await prPreviews.get("student-files/a")).toBeNull();
    expect(await prPreviews.list("")).toEqual([]);
    expect([...store.files.keys()]).toEqual(["main-preview/student-files/a"]);
  });

  it("lists its own files by their own keys", async () => {
    const store = memoryStore();
    const place = inPlace(store, "local");
    await place.put("student-files/a", FILE);
    await place.put("other/b", FILE);

    expect(await place.list("student-files/")).toEqual(["student-files/a"]);
  });
});
