import type { Parsed } from "@/parsed";
import { checkFileShape } from "./csv-file";
import type { SentFile } from "./file-check";

const NO_FILE = {
  ok: false,
  error: "Berkas tidak diterima. Pilih berkas CSV, lalu coba lagi.",
} as const;

/**
 * The CSV file of a sent form, under `file`, refused by name or size
 * before it is read.
 */
export async function sentCsvFile(form: FormData): Promise<Parsed<SentFile>> {
  const file = form.get("file");
  if (!(file instanceof File)) return NO_FILE;
  const wrongShape = checkFileShape(file.name, file.size);
  if (wrongShape) return { ok: false, error: wrongShape };
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { ok: true, value: { name: file.name, bytes } };
}
