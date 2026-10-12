import { Notice } from "@/ui/notice";

// Without this file an unknown address inside the app would be answered
// outside the menu, by the page that also holds the sign-in page.
export default function NotFound() {
  return (
    <Notice title="Halaman tidak ditemukan">
      Alamat ini tidak ada. Pilih halaman lain dari menu.
    </Notice>
  );
}
