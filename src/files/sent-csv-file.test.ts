import { describe, expect, it } from "vitest";
import { sentCsvFile } from "./sent-csv-file";

function formWith(file: File | string): FormData {
  const form = new FormData();
  form.set("file", file);
  return form;
}

describe("sentCsvFile", () => {
  it("gives the name and the bytes of the sent file", async () => {
    const sent = await sentCsvFile(formWith(new File(["nim\n1"], "a.csv")));

    expect(sent).toEqual({
      ok: true,
      value: { name: "a.csv", bytes: new TextEncoder().encode("nim\n1") },
    });
  });

  it("refuses a form without a file", async () => {
    expect(await sentCsvFile(formWith("a.csv"))).toEqual({
      ok: false,
      error: "Berkas tidak diterima. Pilih berkas CSV, lalu coba lagi.",
    });
  });

  it("refuses a file that is not CSV before it is read", async () => {
    const sent = await sentCsvFile(formWith(new File(["x"], "a.xlsx")));

    expect(sent).toEqual({
      ok: false,
      error:
        "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
    });
  });
});
