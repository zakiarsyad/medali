import { Notice } from "@/ui/notice";

export default function Forbidden() {
  return (
    <Notice title="Akses ditolak">
      Peran Anda tidak dapat membuka halaman ini. Pilih halaman lain dari menu.
    </Notice>
  );
}
