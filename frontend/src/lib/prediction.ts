export type PredictionResult = {
  label: "NORMAL" | "PNEUMONIA";
  probability: number;
  threshold: number;
};

// The API's probability is always the pneumonia score, including NORMAL results.
export function parsePrediction(value: unknown): PredictionResult {
  if (!value || typeof value !== "object")
    throw new Error(
      "The service returned an unreadable result. Please try again.",
    );
  const data = value as Record<string, unknown>;
  if (
    (data.label !== "NORMAL" && data.label !== "PNEUMONIA") ||
    typeof data.probability !== "number" ||
    !Number.isFinite(data.probability) ||
    data.probability < 0 ||
    data.probability > 1 ||
    typeof data.threshold !== "number" ||
    !Number.isFinite(data.threshold) ||
    data.threshold < 0 ||
    data.threshold > 1 ||
    (data.probability >= data.threshold ? "PNEUMONIA" : "NORMAL") !== data.label
  ) {
    throw new Error(
      "The service returned an invalid result. Please try again.",
    );
  }
  return data as PredictionResult;
}

export function validateImage(file: File): string | null {
  if (!["image/jpeg", "image/png"].includes(file.type))
    return "Choose a JPEG or PNG image. Other formats are not supported.";
  if (!file.size) return "This file is empty. Please choose another image.";
  if (file.size > 5_000_000)
    return "This image is too large. Please choose a file under 5 MB.";
  return null;
}
