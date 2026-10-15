import { DAY } from "./day";

/**
 * What a record says where its proof photo or attachment was, once the
 * file was removed as old proof; null while it is not removed.
 */
export function removedFileWords(removedAt: Date | null): string | null {
  if (removedAt === null) return null;
  return `Berkas sudah dihapus pada ${DAY.format(removedAt)}.`;
}
