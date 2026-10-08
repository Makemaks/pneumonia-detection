<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppIcon from "./AppIcon.vue";
import type { PredictionResult } from "../lib/prediction";
const props = defineProps<{
  result: PredictionResult;
  fileName: string;
  previewUrl: string;
  completedAt: string;
}>();
defineEmits<{ reset: [] }>();
const resultTitle = ref<HTMLElement | null>(null);
onMounted(() => resultTitle.value?.focus({ preventScroll: true }));
const positive = computed(() => props.result.label === "PNEUMONIA");
const pneumonia = computed(() => (props.result.probability * 100).toFixed(1));
const normal = computed(() =>
  ((1 - props.result.probability) * 100).toFixed(1),
);
const threshold = computed(() => (props.result.threshold * 100).toFixed(1));
const nearThreshold = computed(
  () => Math.abs(props.result.probability - props.result.threshold) < 0.1,
);
const dateLabel = computed(() =>
  new Date(props.completedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
);
function downloadReport() {
  const report = [
    "PULMO — CHEST X-RAY ANALYSIS",
    "Research and education only. Not a medical diagnosis.",
    "",
    `Image: ${props.fileName}`,
    `Analyzed: ${new Date(props.completedAt).toLocaleString()}`,
    "Model: DenseNet201",
    `Prediction: ${props.result.label}`,
    `Pneumonia model score: ${pneumonia.value}%`,
    `Normal model score: ${normal.value}%`,
    `Pneumonia classification threshold: ${threshold.value}%`,
    "",
    "The score is a model output, not a calibrated clinical probability or a measure of diagnostic certainty.",
    "A normal prediction does not rule out pneumonia or another condition. Review with a qualified clinician.",
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([report], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pulmo-analysis-${new Date(props.completedAt).toLocaleDateString("en-CA")}.txt`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <div class="result-content">
    <div class="result-complete" role="status">
      <span><AppIcon name="check" :size="14" /> Analysis complete</span
      ><span>{{ dateLabel }}</span>
    </div>
    <div class="result-image-row">
      <img :src="previewUrl" alt="Analyzed chest X-ray" />
      <div>
        <span>YOUR CHEST X-RAY</span
        ><strong :title="fileName">{{ fileName }}</strong
        ><span>DenseNet201 · Image classification</span>
      </div>
    </div>
    <div
      class="prediction-banner"
      :class="positive ? 'prediction-positive' : 'prediction-normal'"
    >
      <span class="prediction-icon"
        ><AppIcon :name="positive ? 'alert' : 'check'" :size="23"
      /></span>
      <div>
        <span>MODEL PREDICTION</span>
        <h3 ref="resultTitle" tabindex="-1">
          {{ positive ? "Pneumonia pattern" : "Normal pattern" }}
        </h3>
        <p>
          {{
            positive
              ? "The model classified this image as pneumonia."
              : "The model classified this image as normal."
          }}
        </p>
      </div>
    </div>
    <div class="score-heading">
      <h4>Understanding the result</h4>
      <span>MODEL SCORES</span>
    </div>
    <div class="score-row">
      <span>Pneumonia</span><strong>{{ pneumonia }}<small>%</small></strong>
    </div>
    <div class="score-track pneumonia-track">
      <span :style="{ width: `${pneumonia}%` }"></span
      ><i
        :style="{ left: `${threshold}%` }"
        :title="`Classification threshold: ${threshold}%`"
      ></i>
    </div>
    <div class="score-row normal-score">
      <span>Normal</span><strong>{{ normal }}<small>%</small></strong>
    </div>
    <div class="score-track normal-track">
      <span :style="{ width: `${normal}%` }"></span>
    </div>
    <div class="threshold-note">
      <span class="threshold-key"></span> Pneumonia threshold: {{ threshold }}%
    </div>
    <p v-if="nearThreshold" class="near-threshold">
      <AppIcon name="info" :size="16" />This score is close to the decision
      threshold. Interpret the classification with particular care.
    </p>
    <p class="result-explainer">
      Scores reflect the model’s output, not diagnostic certainty. A normal
      result does not rule out pneumonia or other conditions.
    </p>
    <div class="result-actions">
      <button class="analyze-button" type="button" @click="$emit('reset')">
        <AppIcon name="plus" :size="18" />New analysis</button
      ><button class="report-button" type="button" @click="downloadReport">
        <AppIcon name="download" :size="18" />Save report
      </button>
    </div>
  </div>
</template>
