import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PrivacyPage from "@/app/privasi/page";

const page = renderToStaticMarkup(<PrivacyPage />);

describe("Kebijakan privasi", () => {
  it("opens for anyone, without asking who is signed in", () => {
    expect(page).toContain("<h1");
    expect(page).toContain("Kebijakan privasi");
  });

  it("names the only three things Google gives", () => {
    expect(page).toContain("alamat email");
    expect(page).toContain("apakah Google sudah memastikan email itu");
    expect(page).toContain("apakah akun itu dikelola oleh kampus");
  });

  it("says what the email is used for", () => {
    expect(page).toContain(
      "memastikan Anda warga kampus dan untuk mencocokkan Anda dengan akun MEDALI Anda",
    );
  });

  it("tells of the sign-in log, which keeps no address of a refusal", () => {
    expect(page).toContain("catatan masuk");
    expect(page).toContain(
      "Percobaan masuk yang ditolak tidak menyimpan alamat email.",
    );
  });

  it("says what is not asked, and that nothing is sold or shared", () => {
    expect(page).toContain(
      "MEDALI tidak meminta nama, foto, kontak, atau data lain dari Google.",
    );
    expect(page).toContain("tidak menjual atau membagikan");
  });

  it("says where the data is kept", () => {
    expect(page).toContain(
      "Data disimpan di server penyedia hosting yang dipakai MEDALI untuk sementara, sampai MEDALI pindah ke server kampus.",
    );
  });

  it("gives the address for questions, and the date it was last updated", () => {
    expect(page).toContain('href="mailto:asramaupk@gmail.com"');
    expect(page).toContain("Terakhir diperbarui: 3 November 2026");
  });
});
