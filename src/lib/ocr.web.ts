/**
 * On-device OCR — web.
 *
 * Runs Tesseract (WebAssembly) entirely in the browser. All worker, wasm, and
 * language files are served from this app's own /tesseract/ path (see
 * public/tesseract/), so scanning works with no internet and no cloud call.
 */
import { createWorker } from 'tesseract.js';

let workerPromise: ReturnType<typeof createWorker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/',
      langPath: '/tesseract',
    });
  }
  return workerPromise;
}

export async function runOfflineOcr(
  imageBase64: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(`data:${mimeType};base64,${imageBase64}`);
    return data.text?.trim() ? data.text : null;
  } catch {
    // Reset so a transient load failure can retry next time.
    workerPromise = null;
    return null;
  }
}

export const OFFLINE_OCR_AVAILABLE = true;
