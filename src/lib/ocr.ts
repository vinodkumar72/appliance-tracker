/**
 * On-device OCR — native platforms.
 *
 * Fully offline OCR on iOS/Android needs a native ML module (Google ML Kit /
 * Apple Vision), which cannot load inside Expo Go — it requires a development
 * build of the app. Until then this returns null and the caller falls back to
 * the cloud scan. When the project moves to a dev build, implement this with
 * @react-native-ml-kit/text-recognition and keep the same signature.
 */
export async function runOfflineOcr(
  _imageBase64: string,
  _mimeType: string,
): Promise<string | null> {
  return null;
}

export const OFFLINE_OCR_AVAILABLE = false;
