"use client";

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// MUST match the exact-pinned version in package.json. Renovate / `npm
// install` won't bump this on its own because we used `--save-exact` (no
// caret), but if you DO bump the dep, update the constant in the same PR
// — a JS↔WASM mismatch from jsDelivr is silent and catastrophic.
// (We don't `import { version } from "@mediapipe/tasks-vision/package.json"`
// because the package's `exports` map doesn't expose package.json under
// "moduleResolution": "bundler".)
const PINNED_VERSION = "0.10.35";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${PINNED_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

let promise: Promise<FaceLandmarker> | null = null;

// Singleton — the model is ~3MB and the WASM is ~1MB; loading once and
// re-using across remounts (back/forward through onboarding) is essential.
// `runningMode: "VIDEO"` enables the smoother per-frame tracking variant.
// MediaPipe falls back to CPU automatically if the GPU delegate fails.
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (promise) return promise;
  promise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  })();
  return promise;
}
