export const CLASS_ORDER = ["NORMAL", "VIRAL", "BACTERIAL"] as const;
export type PredictionLabel = (typeof CLASS_ORDER)[number];
export const PREDICTION_LABELS: Record<PredictionLabel, string> = {
  NORMAL: "Normal",
  VIRAL: "Viral pneumonia",
  BACTERIAL: "Bacterial pneumonia",
};

export type PredictionResult = {
  model: "FT-004";
  model_version: string;
  label: PredictionLabel;
  probabilities: Record<PredictionLabel, number>;
  class_order: typeof CLASS_ORDER;
  member_count: 3;
};

// FT-004 returns the equal mean of three softmax vectors in this class order.
// Allow only floating-point rounding in their sum; never infer a missing score.
export function parsePrediction(value: unknown): PredictionResult {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "The service returned an unreadable result. Please try again.",
    );
  const data = value as Record<string, unknown>;
  const classOrder = data.class_order;
  const scores = data.probabilities;
  if (
    data.model !== "FT-004" ||
    typeof data.model_version !== "string" ||
    !/^[a-f0-9]{40}$/.test(data.model_version) ||
    data.member_count !== 3 ||
    !Array.isArray(classOrder) ||
    classOrder.length !== CLASS_ORDER.length ||
    !CLASS_ORDER.every((label, index) => classOrder[index] === label) ||
    !scores ||
    typeof scores !== "object" ||
    Array.isArray(scores)
  )
    throw new Error("The service returned an invalid FT-004 result. Please try again.");

  const probabilities = scores as Record<string, unknown>;
  if (
    Object.keys(probabilities).length !== CLASS_ORDER.length ||
    !CLASS_ORDER.every((label) => {
      const score = probabilities[label];
      return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 1;
    })
  )
    throw new Error("The service returned invalid model scores. Please try again.");

  const validatedScores = probabilities as Record<PredictionLabel, number>;
  const sum = CLASS_ORDER.reduce((total, label) => total + validatedScores[label], 0);
  const winner = CLASS_ORDER.reduce((best, label) =>
    validatedScores[label] > validatedScores[best] ? label : best,
  );
  if (Math.abs(sum - 1) > 0.00001 || data.label !== winner)
    throw new Error("The service returned inconsistent model scores. Please try again.");

  return {
    model: "FT-004",
    model_version: data.model_version,
    label: winner,
    probabilities: {
      NORMAL: validatedScores.NORMAL,
      VIRAL: validatedScores.VIRAL,
      BACTERIAL: validatedScores.BACTERIAL,
    },
    class_order: CLASS_ORDER,
    member_count: 3,
  };
}

export function validateImage(file: File): string | null {
  if (!["image/jpeg", "image/png"].includes(file.type))
    return "Choose a JPEG or PNG image. Other formats are not supported.";
  if (!file.size) return "This file is empty. Please choose another image.";
  if (file.size > 5_000_000)
    return "This image is too large. Please choose a file under 5 MB.";
  return null;
}
