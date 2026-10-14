import { describe, expect, it } from "vitest";
import {
  CAMERA_BUSY,
  CAMERA_FAILED,
  CAMERA_NOT_ALLOWED,
  cameraFault,
  NO_CAMERA,
} from "./camera-fault";

function thrown(name: string): Error {
  const error = new Error("camera");
  error.name = name;
  return error;
}

describe("cameraFault", () => {
  it("says how to allow the camera when it is not allowed", () => {
    expect(cameraFault(thrown("NotAllowedError"))).toBe(CAMERA_NOT_ALLOWED);
    expect(cameraFault(thrown("SecurityError"))).toBe(CAMERA_NOT_ALLOWED);
    expect(CAMERA_NOT_ALLOWED).toContain("aktifkan Kamera");
  });

  it("tells a missing camera from one that is busy", () => {
    expect(cameraFault(thrown("NotFoundError"))).toBe(NO_CAMERA);
    expect(cameraFault(thrown("NotReadableError"))).toBe(CAMERA_BUSY);
  });

  it("says to try again for anything else", () => {
    expect(cameraFault(thrown("TypeError"))).toBe(CAMERA_FAILED);
    expect(cameraFault(thrown("toString"))).toBe(CAMERA_FAILED);
    expect(cameraFault("no")).toBe(CAMERA_FAILED);
  });
});
