import { readFileStorageSettings } from "@/settings";
import type { FileStore } from "./file-store";
import { objectStore } from "./object-store";

/** The app's file storage, named by the settings. */
export function fileStorage(): FileStore {
  return objectStore(readFileStorageSettings());
}
