import { currentStage, readFileStorageSettings } from "@/settings";
import { filePlaceOf, inPlace } from "./file-places";
import type { FileStore } from "./file-store";
import { objectStore } from "./object-store";

/**
 * The app's file storage, named by the settings and limited to the place
 * of the environment the app runs in. Null where file keeping is off.
 */
export function fileStorage(): FileStore | null {
  const settings = readFileStorageSettings();
  if (!settings) return null;
  return inPlace(objectStore(settings), filePlaceOf(currentStage()));
}
