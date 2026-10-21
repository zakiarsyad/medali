"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { FormState } from "@/ui/form-message";
import { shrinkPhoto } from "@/ui/shrink-photo";
import { sendAttendancePhotoAction } from "./actions";
import { PhotoSenderView } from "./photo-sender-view";
import {
  createPhotoUpload,
  type StartSend,
  type UploadEdges,
} from "./photo-upload";

/** The upload's ties to this browser and to the server. */
const EDGES: UploadEdges = {
  shrink: shrinkPhoto,
  showPreview: (photo) => URL.createObjectURL(photo),
  dropPreview: (address) => URL.revokeObjectURL(address),
  send: sendAttendancePhotoAction,
  rethrow: unstable_rethrow,
};

/**
 * Takes or picks the attendance photo of one schedule, shows it, and
 * sends it. What it decides is in the upload it holds and what it draws
 * in its view; this only ties the two to the browser. What the server
 * answers goes to `onAnswer`; a new send or pick is told to `onRestart`.
 */
export function PhotoSender({
  scheduleId,
  startSend,
  onAnswer,
  onRestart,
  onCancel,
}: {
  scheduleId: string;
  startSend: StartSend;
  onAnswer: (answer: FormState) => void;
  onRestart: () => void;
  onCancel: () => void;
}) {
  const [upload] = useState(() =>
    createPhotoUpload({
      scheduleId,
      edges: EDGES,
      onAnswer,
      onRestart,
      onCancel,
    }),
  );
  const state = useSyncExternalStore(
    upload.subscribe,
    upload.state,
    upload.state,
  );
  // The preview is kept by the browser until it is let go of.
  useEffect(() => {
    upload.enter();
    return upload.leave;
  }, [upload]);

  return (
    <PhotoSenderView
      state={state}
      onPick={upload.pick}
      onSend={() => startSend(upload.send)}
      onRedo={upload.redo}
      onCancel={upload.cancel}
    />
  );
}
