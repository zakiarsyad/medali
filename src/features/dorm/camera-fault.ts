/*
 * What the report of a return says when the camera does not open. Read
 * by the camera in the browser, so nothing here may take from the
 * database code.
 */

export const CAMERA_NOT_ALLOWED =
  "Kamera tidak diizinkan. Izinkan kamera untuk situs ini: ketuk ikon di samping alamat situs, pilih Izin atau Setelan situs, aktifkan Kamera, lalu tekan Buka kamera lagi.";

export const NO_CAMERA =
  "Kamera tidak ditemukan di perangkat ini. Laporkan kembali dari ponsel yang berkamera.";

export const CAMERA_BUSY =
  "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu, lalu tekan Buka kamera lagi.";

export const NO_CAMERA_HERE =
  "Browser ini tidak dapat membuka kamera. Buka halaman ini di Chrome atau Safari terbaru.";

export const CAMERA_FAILED = "Kamera tidak dapat dibuka. Coba lagi.";

const FAULTS: Record<string, string> = {
  NotAllowedError: CAMERA_NOT_ALLOWED,
  SecurityError: CAMERA_NOT_ALLOWED,
  NotFoundError: NO_CAMERA,
  OverconstrainedError: NO_CAMERA,
  NotReadableError: CAMERA_BUSY,
  AbortError: CAMERA_BUSY,
};

/** The name of what the browser threw; some browsers throw no Error. */
function nameOf(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  if (!("name" in error)) return "";
  return String(error.name);
}

/** What to say when the browser does not give the camera, by what it threw. */
export function cameraFault(error: unknown): string {
  const name = nameOf(error);
  if (!Object.hasOwn(FAULTS, name)) return CAMERA_FAILED;
  return FAULTS[name] ?? CAMERA_FAILED;
}
