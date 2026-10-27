// Thin wrapper around expo-mlkit-ocr (on-device text reading from a photo).
//
// The package is loaded with require() inside try/catch on purpose: if the installed
// development build was made BEFORE the package was added, importing it would throw.
// Here that just turns OCR off, and the screen falls back to manual date entry.
type OcrModule = typeof import('expo-mlkit-ocr');

let ocr: OcrModule | null = null;
try {
  ocr = require('expo-mlkit-ocr') as OcrModule;
} catch {
  ocr = null;
}

export function isOcrAvailable(): boolean {
  try {
    return ocr !== null && ocr.isSupported();
  } catch {
    return false;
  }
}

// Returns all text found in the picture at `uri` (empty string if none).
export async function readText(uri: string): Promise<string> {
  if (!ocr) throw new Error('OCR is not available in this build.');
  const result = await ocr.recognizeText(uri);
  return result.text;
}
