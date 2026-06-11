<template>
  <div class="result-panel" aria-live="polite">
    <div class="result-summary">
      <span class="result-icon" :class="toneClass">
        <i :class="toneIcon" />
      </span>
      <div>
        <p class="eyebrow">Prediction result</p>
        <h3>{{ result.label }}</h3>
      </div>
    </div>

    <div class="confidence-meter">
      <div class="meter-label">
        <span>Confidence</span>
        <strong>{{ confidence }}%</strong>
      </div>
      <div class="meter-track">
        <span :style="{ width: `${confidence}%` }" />
      </div>
    </div>

    <dl class="result-details">
      <div>
        <dt>Probability</dt>
        <dd>{{ result.probability.toFixed(4) }}</dd>
      </div>
      <div>
        <dt>Threshold</dt>
        <dd>{{ result.threshold.toFixed(2) }}</dd>
      </div>
    </dl>

    <p class="clinical-note">
      This output supports research review only. A licensed clinician should interpret X-rays with symptoms and patient history.
    </p>

    <Button label="Try another image" icon="pi pi-refresh" severity="info" @click="$emit('reset')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PredictionResult } from "./AnalyzerPanel.vue";

const props = defineProps<{
  result: PredictionResult;
}>();

defineEmits<{
  reset: [];
}>();

const confidence = computed(() => Math.round(props.result.probability * 1000) / 10);
const isPneumonia = computed(() => props.result.label.toUpperCase().includes("PNEUMONIA"));
const toneClass = computed(() => (isPneumonia.value ? "result-alert" : "result-clear"));
const toneIcon = computed(() => (isPneumonia.value ? "pi pi-exclamation-triangle" : "pi pi-check"));
</script>
