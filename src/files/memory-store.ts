import type { FileStore, StoredFile } from "./file-store";

/** Stand-ins for the file storage, so the checks need no running storage. */

export interface MemoryStore extends FileStore {
  files: Map<string, StoredFile>;
}

export function memoryStore(): MemoryStore {
  const files = new Map<string, StoredFile>();
  return {
    files,
    async put(key, file) {
      files.set(key, file);
    },
    async get(key) {
      return files.get(key)?.bytes ?? null;
    },
    async remove(key) {
      files.delete(key);
    },
  };
}

/** A file storage that cannot be reached: every call fails. */
export function unreachableStore(): FileStore {
  async function fail(): Promise<never> {
    throw new Error("The file storage cannot be reached.");
  }
  return { put: fail, get: fail, remove: fail };
}
