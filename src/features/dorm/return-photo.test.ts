import { describe, expect, it } from "vitest";
import { returnSendFault } from "./return-photo";

function reportForm(): FormData {
  const form = new FormData();
  form.set("leaveId", "a");
  form.set("photo", new Blob([new Uint8Array(10)]), "foto.jpg");
  return form;
}

describe("returnSendFault", () => {
  it("says the photo is too large when the send is refused for its size", () => {
    const refused = new Error("Body exceeded 4400000 limit.");

    expect(returnSendFault(refused, reportForm())).toBe(
      "Ukuran foto maksimal 2 MB. Ambil foto lagi.",
    );
  });

  it("asks to check the connection for any other failure", () => {
    expect(
      returnSendFault(new TypeError("Failed to fetch"), reportForm()),
    ).toBe(
      "Laporan tidak terkirim. Periksa koneksi internet, lalu tekan Kirim laporan kembali lagi.",
    );
  });
});
