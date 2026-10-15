import {
  type CountsByKind,
  PROOF_KIND_TITLES,
  PROOF_KINDS,
} from "./proof-kinds";

/*
 * Read by the button in the browser, so nothing here may take from the
 * database code.
 */

export const CANNOT_BE_UNDONE = "Berkas yang dihapus tidak dapat dikembalikan.";

/**
 * What "Hapus berkas lama" asks before anything goes: how many files of
 * each kind will go, leaving out a kind with none, and that they cannot
 * be brought back.
 */
export function removalQuestion(removable: CountsByKind): string {
  const lines = ["Hapus berkas lama berikut?"];
  for (const kind of PROOF_KINDS) {
    const files = removable[kind];
    if (files === 0) continue;
    lines.push(
      `${PROOF_KIND_TITLES[kind]}: ${files.toLocaleString("id-ID")} berkas`,
    );
  }
  lines.push(CANNOT_BE_UNDONE);
  return lines.join("\n");
}

export function removedWords(files: number): string {
  return `${files.toLocaleString("id-ID")} berkas dihapus.`;
}
