import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import {
  NOT_A_PICTURE,
  PHOTO_FILE_NAME,
  pickedPhotoFault,
} from "./attendance-photo";

/*
 * What the upload of a card decides, apart from how it is drawn, so it
 * can be checked without a browser. Read by the upload in the browser:
 * nothing here may take from the database code.
 */

/** Said when the photo did not reach the server, or no answer came back. */
export const SEND_FAILED =
  "Foto tidak terkirim. Periksa koneksi internet, lalu tekan Kirim presensi lagi.";

/** A picked photo, made smaller, with the address its preview is shown from. */
export interface ReadyPhoto {
  blob: Blob;
  preview: string;
}

/** Where the upload of one card stands. */
export interface UploadState {
  /** The photo that is shown and ready to send, or null while none is picked. */
  photo: ReadyPhoto | null;
  /** What is wrong with the file that was picked last, or null. */
  fault: string | null;
  /** Whether a picked file is being made smaller. */
  reading: boolean;
  /** Whether the photo is on its way to the server. */
  sending: boolean;
}

/** What the upload needs from the browser and from the server. */
export interface UploadEdges {
  /** The picture made smaller, or null when the file is no picture. */
  shrink: (file: Blob) => Promise<Blob | null>;
  /** An address the browser shows the photo from, kept until dropped. */
  showPreview: (photo: Blob) => string;
  dropPreview: (address: string) => void;
  send: (form: FormData) => Promise<Parsed<string>>;
  /** Throws again what is no failure, as an answer that leads elsewhere. */
  rethrow: (error: unknown) => void;
}

/**
 * Starts a send in a way that outlives the card it was pressed on: the
 * part that holds every card runs it, so an answer that leads the
 * student elsewhere still reaches the page after that card has closed.
 */
export type StartSend = (send: () => Promise<void>) => void;

export interface PhotoUploadParts {
  scheduleId: string;
  edges: UploadEdges;
  /** Told what the server answered, or that the photo did not arrive. */
  onAnswer: (answer: FormState) => void;
  onCancel: () => void;
}

/** The upload of one card: its state, and what each button does. */
export interface PhotoUpload {
  state: () => UploadState;
  /** Calls back after every change of the state, until the answer is called. */
  subscribe: (listener: () => void) => () => void;
  pick: (file: File) => Promise<void>;
  redo: () => void;
  send: () => Promise<void>;
  cancel: () => void;
  /**
   * Lets go of the preview when the upload leaves the screen, and makes
   * none for a picture that is ready only after that.
   */
  leave: () => void;
  /**
   * Called when the upload is on the screen. While it is developed, the
   * screen part is put on, taken off and put on again at the start, so
   * leaving must be able to be undone.
   */
  enter: () => void;
}

const START: UploadState = {
  photo: null,
  fault: null,
  reading: false,
  sending: false,
};

function formOf(scheduleId: string, photo: Blob): FormData {
  const form = new FormData();
  form.set("scheduleId", scheduleId);
  form.set("photo", photo, PHOTO_FILE_NAME);
  return form;
}

/**
 * The upload of the attendance photo of one schedule. A picked file is
 * checked, made smaller and shown; nothing is sent until "Kirim
 * presensi". While a file is read or the photo is sent, every other
 * press is left alone, so a second press of "Kirim presensi" sends
 * nothing more.
 */
export function createPhotoUpload(parts: PhotoUploadParts): PhotoUpload {
  const { scheduleId, edges, onAnswer, onCancel } = parts;
  const listeners = new Set<() => void>();
  let state = START;
  let hasLeft = false;

  function change(next: Partial<UploadState>): void {
    state = { ...state, ...next };
    for (const listener of listeners) listener();
  }

  function isBusy(): boolean {
    return state.reading || state.sending;
  }

  function dropPhoto(): void {
    if (state.photo === null) return;
    edges.dropPreview(state.photo.preview);
    change({ photo: null });
  }

  async function pick(file: File): Promise<void> {
    if (isBusy()) return;
    const wrong = pickedPhotoFault(file.type, file.size);
    if (wrong !== null) return change({ fault: wrong });
    change({ reading: true, fault: null });
    const blob = await shrunk(file);
    change({ reading: false });
    if (blob === null) return change({ fault: NOT_A_PICTURE });
    // A preview made now would be held by the browser for nobody.
    if (hasLeft) return;
    change({ photo: { blob, preview: edges.showPreview(blob) } });
  }

  /**
   * The file made smaller. A picture the browser fails on while drawing
   * it counts as one it cannot read: the student is told the same.
   */
  async function shrunk(file: File): Promise<Blob | null> {
    try {
      return await edges.shrink(file);
    } catch (error) {
      console.error("A picked picture was not made smaller.", error);
      return null;
    }
  }

  function enter(): void {
    hasLeft = false;
  }

  function leave(): void {
    hasLeft = true;
    dropPhoto();
  }

  function redo(): void {
    if (isBusy()) return;
    dropPhoto();
    change({ fault: null });
  }

  async function send(): Promise<void> {
    const { photo } = state;
    if (photo === null || isBusy()) return;
    change({ sending: true });
    try {
      const sent = await edges.send(formOf(scheduleId, photo.blob));
      onAnswer(
        sent.ok
          ? { error: null, done: sent.value }
          : { error: sent.error, done: null },
      );
    } catch (error) {
      edges.rethrow(error);
      onAnswer({ error: SEND_FAILED, done: null });
    } finally {
      // The photo stays, so it can be sent again.
      change({ sending: false });
    }
  }

  function cancel(): void {
    if (isBusy()) return;
    dropPhoto();
    onCancel();
  }

  return {
    state: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    pick,
    redo,
    send,
    cancel,
    enter,
    leave,
  };
}
