export const CLASS_ORDER = ["NORMAL", "VIRAL", "BACTERIAL"] as const;
export type PredictionLabel = (typeof CLASS_ORDER)[number];
export type ModelSource = "kaggle" | "doctor";
export const MODEL_CATALOG = {
  kaggle: { model: "FT-004", version: "7a90abfa3695f61a17e4a2dd959c0da822080b21", label: "Kaggle dataset — original FT-004" },
  doctor: { model: "DOCTOR-SHARED-701515", version: "4484aef80293d996944f20a04774ae2ec57a11ffd8272b8c942a72178291e5e2", label: "Doctor-shared dataset — grouped 70/15/15" },
} as const;
export const PREDICTION_LABELS: Record<PredictionLabel, string> = {
  NORMAL: "Normal",
  VIRAL: "Viral pneumonia",
  BACTERIAL: "Bacterial pneumonia",
};

export type PredictionResult = {
  model: "FT-004" | "DOCTOR-SHARED-701515";
  model_version: string;
  model_source: ModelSource;
  label: PredictionLabel;
  probabilities: Record<PredictionLabel, number>;
  class_order: typeof CLASS_ORDER;
  member_count: 3;
};

// FT-004 returns the equal mean of three softmax vectors in this class order.
// Allow only floating-point rounding in their sum; never infer a missing score.
export function parsePrediction(value: unknown, source: ModelSource = "kaggle"): PredictionResult {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "The service returned an unreadable result. Please try again.",
    );
  const data = value as Record<string, unknown>;
  const classOrder = data.class_order;
  const scores = data.probabilities;
  if (
    data.model !== MODEL_CATALOG[source].model ||
    data.model_version !== MODEL_CATALOG[source].version ||
    (data.model_source !== undefined && data.model_source !== source) ||
    (source === "doctor" && data.model_source !== "doctor") ||
    data.member_count !== 3 ||
    !Array.isArray(classOrder) ||
    classOrder.length !== CLASS_ORDER.length ||
    !CLASS_ORDER.every((label, index) => classOrder[index] === label) ||
    !scores ||
    typeof scores !== "object" ||
    Array.isArray(scores)
  )
    throw new Error("The service returned an invalid or wrong-dataset model result. Please try again.");

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
    model: MODEL_CATALOG[source].model,
    model_version: MODEL_CATALOG[source].version,
    model_source: source,
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
