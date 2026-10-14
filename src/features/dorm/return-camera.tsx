"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { JPEG } from "@/files/file-kinds";
import shared from "@/ui/data-screen.module.css";
import { shrunkSize } from "@/ui/photo-size";
import { CAMERA_FAILED, cameraFault, NO_CAMERA_HERE } from "./camera-fault";
import styles from "./leave.module.css";
import { sendReturnReportAction } from "./leave-actions";
import { RETURN_PHOTO_FILE_NAME } from "./return-photo";

/** How much of the detail a sent photo keeps: enough to see the dorm. */
const JPEG_QUALITY = 0.72;

export const SEND_FAILED =
  "Laporan tidak terkirim. Periksa koneksi internet, lalu tekan Kirim laporan kembali lagi.";

/** Where the camera stands: shut, opening, showing what it sees, or a photo taken. */
type Stage = "shut" | "opening" | "live" | "taken";

interface TakenPhoto {
  blob: Blob;
  preview: string;
}

function stopCamera(stream: MediaStream | null): void {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

/** What the camera shows now, made smaller and drawn as a JPEG. */
function frameOf(video: HTMLVideoElement): Promise<Blob | null> {
  const size = shrunkSize({
    width: video.videoWidth,
    height: video.videoHeight,
  });
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (context === null) return Promise.resolve(null);
  context.drawImage(video, 0, 0, size.width, size.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, JPEG.contentType, JPEG_QUALITY);
  });
}

function formOf(leaveId: string, reportId: string, photo: Blob): FormData {
  const form = new FormData();
  form.set("leaveId", leaveId);
  form.set("reportId", reportId);
  form.set("photo", photo, RETURN_PHOTO_FILE_NAME);
  return form;
}

/**
 * "Lapor kembali ke asrama" opened: the camera of the phone, and only the
 * camera, as the photo must be taken at the dorm now. "Buka kamera" shows
 * what it sees, "Ambil foto" keeps that, and "Kirim laporan kembali"
 * sends it. When the camera is not given, it says why and how to allow
 * it. While the photo is on its way every button waits, so a second press
 * sends nothing more; the key of the report keeps it once on the server.
 */
export function ReturnCamera({
  leaveId,
  reportId,
  returnBy,
  onSent,
  onCancel,
}: {
  leaveId: string;
  reportId: string;
  /** The return time of the leave, as the screens show it. */
  returnBy: string;
  onSent: (words: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>("shut");
  const [photo, setPhoto] = useState<TakenPhoto | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // The camera is let go of when the report closes.
  useEffect(() => () => stopCamera(streamRef.current), []);
  // The preview is kept by the browser until it is let go of.
  useEffect(() => {
    if (photo === null) return;
    return () => URL.revokeObjectURL(photo.preview);
  }, [photo]);

  function shut(): void {
    stopCamera(streamRef.current);
    streamRef.current = null;
  }

  async function open(): Promise<void> {
    setFault(null);
    setPhoto(null);
    const video = videoRef.current;
    if (!navigator.mediaDevices?.getUserMedia || video === null) {
      setFault(NO_CAMERA_HERE);
      return;
    }
    setStage("opening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setStage("live");
    } catch (error) {
      shut();
      setFault(cameraFault(error));
      setStage("shut");
    }
  }

  async function take(): Promise<void> {
    const video = videoRef.current;
    if (video === null || video.videoWidth === 0) return;
    const blob = await frameOf(video);
    shut();
    if (blob === null) {
      setFault(CAMERA_FAILED);
      setStage("shut");
      return;
    }
    setPhoto({ blob, preview: URL.createObjectURL(blob) });
    setStage("taken");
  }

  async function send(): Promise<void> {
    if (photo === null || sending) return;
    setSending(true);
    setFault(null);
    try {
      const sent = await sendReturnReportAction(
        formOf(leaveId, reportId, photo.blob),
      );
      if (sent.ok) {
        onSent(sent.value);
        return;
      }
      setFault(sent.error);
    } catch (error) {
      unstable_rethrow(error);
      setFault(SEND_FAILED);
    } finally {
      setSending(false);
    }
  }

  function cancel(): void {
    shut();
    onCancel();
  }

  const busy = stage === "opening" || sending;
  return (
    <div className={styles.camera}>
      <p className={styles.note}>
        Ambil foto diri di asrama dengan kamera. Batas kembali <b>{returnBy}</b>
        ; laporan setelah waktu itu tercatat terlambat. Laporan diverifikasi BAM
        lalu divalidasi Pengelola Asrama.
      </p>
      <video
        ref={videoRef}
        className={styles.cameraView}
        hidden={stage !== "live"}
        playsInline
        muted
      />
      {photo !== null && (
        // biome-ignore lint/performance/noImgElement: the picture exists only in this browser, where the image optimiser of the server cannot fetch it.
        <img
          src={photo.preview}
          alt="Pratinjau foto lapor kembali"
          className={styles.cameraView}
        />
      )}
      <div className={shared.actions}>
        {stage === "live" && (
          <button type="button" className={shared.button} onClick={take}>
            Ambil foto
          </button>
        )}
        {stage === "taken" && (
          <>
            <button
              type="button"
              className={shared.button}
              disabled={busy}
              onClick={send}
            >
              {sending ? "Mengirim…" : "Kirim laporan kembali"}
            </button>
            <button
              type="button"
              className={shared.quiet}
              disabled={busy}
              onClick={open}
            >
              Ulangi
            </button>
          </>
        )}
        {(stage === "shut" || stage === "opening") && (
          <button
            type="button"
            className={shared.button}
            disabled={busy}
            onClick={open}
          >
            {stage === "opening" ? "Membuka kamera…" : "Buka kamera"}
          </button>
        )}
        <button
          type="button"
          className={shared.quiet}
          disabled={sending}
          onClick={cancel}
        >
          Batal
        </button>
      </div>
      {fault !== null && (
        <p className={shared.error} role="alert">
          {fault}
        </p>
      )}
    </div>
  );
}
