import { JPEG } from "@/files/file-kinds";
import { PHOTO_MAX_SIDE, shrunkSize } from "./photo-size";

/*
 * Runs in the browser only: it draws the picked picture with the
 * browser's own canvas, so no library is needed to make it smaller.
 */

/** How much of the detail a sent photo keeps: enough to see who is where. */
const JPEG_QUALITY = 0.72;

/** The picture a file holds, or null when the browser cannot read it as one. */
function pictureAt(address: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const picture = new Image();
    picture.onload = () => resolve(picture);
    picture.onerror = () => resolve(null);
    picture.src = address;
  });
}

function drawnSmaller(
  picture: HTMLImageElement,
  maxSide: number,
): Promise<Blob | null> {
  const size = shrunkSize(
    { width: picture.naturalWidth, height: picture.naturalHeight },
    maxSide,
  );
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (context === null) return Promise.resolve(null);
  context.drawImage(picture, 0, 0, size.width, size.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, JPEG.contentType, JPEG_QUALITY);
  });
}

/**
 * A picked picture made smaller and turned into a JPEG, ready to send:
 * `maxSide` dots on its longest side at most, 1,280 unless told
 * otherwise. Null when the file is not a picture this browser can read.
 */
export async function shrinkPhoto(
  file: Blob,
  maxSide: number = PHOTO_MAX_SIDE,
): Promise<Blob | null> {
  const address = URL.createObjectURL(file);
  try {
    const picture = await pictureAt(address);
    if (picture === null) return null;
    return await drawnSmaller(picture, maxSide);
  } finally {
    URL.revokeObjectURL(address);
  }
}
