import type { Stage } from "@/settings";
import type { FileStore } from "./file-store";

/**
 * The part of the file storage each kind of environment keeps its files
 * in. One storage may serve several of them, so each has its own part and
 * none can reach into another's.
 */
export const FILE_PLACES: Record<Stage, string> = {
  local: "local",
  "pr-preview": "pr-previews",
  "main-preview": "main-preview",
  campus: "campus",
};

export function filePlaceOf(stage: Stage): string {
  return FILE_PLACES[stage];
}

/**
 * Whether the app makes the place for files itself. It does where the
 * file storage is its own: on a local computer and in the campus server
 * package. At the previews' service the place is made by hand, once.
 */
export function makesOwnPlace(stage: Stage): boolean {
  return stage === "local" || stage === "campus";
}

/** Every key of a place starts with this; no other place's key does. */
export function placePrefix(place: string): string {
  return `${place}/`;
}

/** The file storage as one place sees it: only its own files. */
export function inPlace(store: FileStore, place: string): FileStore {
  const prefix = placePrefix(place);
  return {
    put: (key, file) => store.put(prefix + key, file),
    get: (key) => store.get(prefix + key),
    remove: (key) => store.remove(prefix + key),
    async list(keyPrefix) {
      const keys = await store.list(prefix + keyPrefix);
      return keys.map((key) => key.slice(prefix.length));
    },
  };
}
