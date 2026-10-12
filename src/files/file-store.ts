/** A file as it is kept in the file storage. */
export interface StoredFile {
  bytes: Uint8Array;
  contentType: string;
}

/**
 * The file storage as the app uses it: MinIO or a service that works like
 * it, or a stand-in for the checks. Only the server holds one. Each call
 * fails loudly when the storage cannot be reached or refuses.
 */
export interface FileStore {
  put(key: string, file: StoredFile): Promise<void>;
  /** The bytes kept under a key, or null when nothing is kept there. */
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}
