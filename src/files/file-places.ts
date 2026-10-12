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
