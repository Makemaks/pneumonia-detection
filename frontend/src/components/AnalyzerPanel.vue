<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import AppIcon from "./AppIcon.vue";
import LungViewer from "./LungViewer.vue";
import ResultCard from "./ResultCard.vue";
import {
  CLASS_ORDER,
  PREDICTION_LABELS,
  parsePrediction,
  validateImage,
  type PredictionResult,
} from "../lib/prediction";

const selectedFile = ref<File | null>(null);
const previewUrl = ref("");
const imageSize = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const browseButton = ref<HTMLButtonElement | null>(null);
const result = ref<PredictionResult | null>(null);
const resultOpen = ref(false);
const viewResultButton = ref<HTMLButtonElement | null>(null);
const completedAt = ref("");
const loading = ref(false);
const validating = ref(false);
const error = ref("");
const dragDepth = ref(0);
const elapsed = ref(0);
const connection = ref<"checking" | "connected" | "offline">("checking");
let request: AbortController | null = null;
let healthRequest: AbortController | null = null;
let elapsedTimer: ReturnType<typeof setInterval> | undefined;
let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
let selectionVersion = 0;
let disposed = false;
const busy = computed(() => loading.value || validating.value);
const step = computed(() => (result.value ? 3 : loading.value ? 2 : 1));
const fileSize = computed(() => {
  const size = selectedFile.value?.size || 0;
  return size < 1_000_000
    ? `${Math.max(1, Math.round(size / 1000))} KB`
    : `${(size / 1_000_000).toFixed(2)} MB`;
});
const statusLabel = computed(
  () =>
    ({
      checking: "Connecting",
      connected: "Service connected",
      offline: "Service unavailable",
    })[connection.value],
);
const uploadLabel = computed(() =>
  selectedFile.value ? "Replace selected X-ray" : "Choose a chest X-ray",
);

async function checkConnection() {
  healthRequest?.abort();
  const controller = new AbortController();
  healthRequest = controller;
  connection.value = "checking";
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("/health", { signal: controller.signal });
    const data = await response.json();
    if (controller === healthRequest && !disposed)
      connection.value =
        response.ok && data.status === "ok" && data.model === "FT-004" &&
        data.member_count === 3 && Array.isArray(data.class_order) &&
        data.class_order.length === CLASS_ORDER.length &&
        CLASS_ORDER.every((label, index) => data.class_order[index] === label)
          ? "connected" : "offline";
  } catch {
    if (controller === healthRequest && !disposed) connection.value = "offline";
  } finally {
    clearTimeout(timer);
  }
}
onMounted(checkConnection);

function releasePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}
function clearTimers() {
  clearInterval(elapsedTimer);
  clearTimeout(timeoutTimer);
}
function cancel() {
  request?.abort();
  request = null;
  clearTimers();
  loading.value = false;
}
function closeResults() {
  resultOpen.value = false;
  void nextTick(() => viewResultButton.value?.focus({ preventScroll: true }));
}
function reset() {
  resultOpen.value = false;
  cancel();
  selectionVersion++;
  releasePreview();
  selectedFile.value = null;
  imageSize.value = "";
  result.value = null;
  error.value = "";
  validating.value = false;
  if (fileInput.value) fileInput.value.value = "";
  void nextTick(() => browseButton.value?.focus({ preventScroll: true }));
}
async function chooseFile(file?: File) {
  if (!file || loading.value) return;
  const version = ++selectionVersion;
  validating.value = false;
  error.value = validateImage(file) || "";
  if (error.value) return;
  validating.value = true;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (disposed || version !== selectionVersion) {
      URL.revokeObjectURL(url);
      return;
    }
    releasePreview();
    previewUrl.value = url;
    selectedFile.value = file;
    imageSize.value = `${image.naturalWidth} × ${image.naturalHeight}`;
    result.value = null;
  } catch {
    URL.revokeObjectURL(url);
    if (version === selectionVersion)
      error.value =
        "This image could not be opened. Please choose a valid JPEG or PNG.";
  } finally {
    if (version === selectionVersion) validating.value = false;
  }
}
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  void chooseFile(input.files?.[0]);
  input.value = "";
}
function onDrop(event: DragEvent) {
  dragDepth.value = 0;
  if (busy.value) return;
  const files = event.dataTransfer?.files;
  if (files && files.length > 1) {
    error.value = "Please upload one chest X-ray at a time.";
    return;
  }
  void chooseFile(files?.[0]);
}
async function analyze() {
  if (!selectedFile.value || busy.value) return;
  error.value = "";
  result.value = null;
  loading.value = true;
  elapsed.value = 0;
  const controller = new AbortController();
  request = controller;
  let timedOut = false;
  const started = Date.now();
  elapsedTimer = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - started) / 1000);
  }, 1000);
  timeoutTimer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 120_000);
  try {
    const body = new FormData();
    body.append("file", selectedFile.value);
    const response = await fetch("/predict", {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 413)
        throw new Error(
          "The server could not accept this image. Try a smaller file.",
        );
      if (response.status === 400 || response.status === 415)
        throw new Error(
          "The image could not be processed. Please choose a valid chest X-ray in JPEG or PNG format.",
        );
      throw new Error(
        "The analysis service could not complete the request. Please try again in a moment.",
      );
    }
    const data = parsePrediction(await response.json());
    if (request !== controller || disposed) return;
    result.value = data;
    completedAt.value = new Date().toISOString();
    resultOpen.value = true;
    connection.value = "connected";
  } catch (cause) {
    if (request !== controller || disposed) return;
    error.value = timedOut
      ? "This analysis took too long. Please try again; the model may still be starting up."
      : cause instanceof TypeError
        ? "Unable to reach the analysis service. Check that the backend is running, then retry."
        : cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.";
    void checkConnection();
  } finally {
    if (request === controller) {
      loading.value = false;
      request = null;
      clearTimers();
    }
  }
}
onBeforeUnmount(() => {
  disposed = true;
  selectionVersion++;
  cancel();
  healthRequest?.abort();
  releasePreview();
});
</script>

<template>
  <div class="workspace-grid">
    <LungViewer :analyzing="loading" />
    <section class="analysis-panel" aria-labelledby="analyzer-title">
      <div class="panel-topline">
        <span class="eyebrow">YOUR ANALYSIS WORKSPACE</span
        ><button
          class="connection-status"
          :class="connection"
          type="button"
          :disabled="connection === 'checking'"
          :aria-label="`${statusLabel}. Check connection`"
          @click="checkConnection"
        >
          <span></span>{{ statusLabel
          }}<AppIcon v-if="connection === 'offline'" name="rotate" :size="12" />
        </button>
      </div>
      <ol class="stepper" aria-label="Analysis progress">
        <li
          v-for="(label, index) in ['Upload', 'Analyze', 'Results']"
          :key="label"
          :class="{ current: step === index + 1, complete: step > index + 1 }"
          :aria-current="step === index + 1 ? 'step' : undefined"
        >
          <span class="step-dot"
            ><AppIcon
              v-if="step > index + 1"
              name="check"
              :size="12"
            /><template v-else>{{ index + 1 }}</template></span
          >{{ label }}<span v-if="index < 2" class="step-line"></span>
        </li>
      </ol>
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept="image/jpeg,image/png"
        :aria-label="uploadLabel"
        :disabled="busy"
        tabindex="-1"
        @change="onFileChange"
      />

      <template v-if="!result">
        <div class="upload-heading">
          <h2 id="analyzer-title">
            {{
              loading
                ? "Looking a little closer."
                : selectedFile
                  ? "Ready when you are."
                  : "Start with a chest X-ray."
            }}
          </h2>
          <p>
            {{
              loading
                ? "FT-004 is comparing Normal, Viral and Bacterial patterns."
                : selectedFile
                  ? "Review your image, then start the analysis."
                  : "A single image. A new layer of insight."
            }}
          </p>
        </div>
        <div
          v-if="!previewUrl"
          class="drop-zone"
          :class="{ dragging: dragDepth > 0, validating }"
          @dragenter.prevent="dragDepth++"
          @dragover.prevent
          @dragleave.prevent="dragDepth = Math.max(0, dragDepth - 1)"
          @drop.prevent="onDrop"
        >
          <div class="upload-illustration">
            <div class="image-sheet sheet-back"></div>
            <div class="image-sheet sheet-front">
              <AppIcon name="image" :size="32" />
            </div>
            <span class="upload-badge"><AppIcon name="plus" :size="16" /></span>
          </div>
          <strong>{{
            validating
              ? "Preparing your preview…"
              : dragDepth > 0
                ? "Drop to add your X-ray"
                : "Drag & drop your X-ray here"
          }}</strong>
          <p>or choose a file from your device</p>
          <button
            ref="browseButton"
            class="browse-button"
            type="button"
            :disabled="busy"
            @click="fileInput?.click()"
          >
            <AppIcon name="upload" :size="16" />Browse files</button
          ><span class="file-requirements"
            >JPEG or PNG <span>·</span> Up to 5 MB <span>·</span> One
            image</span
          >
        </div>
        <div
          v-else
          class="selected-image"
          :class="{ scanning: loading }"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <div class="preview-stage">
            <img
              :src="previewUrl"
              alt="Preview of your selected chest X-ray"
            /><span class="preview-label"
              ><AppIcon name="scan" :size="13" />
              {{ loading ? "ANALYSIS IN PROGRESS" : "IMAGE PREVIEW" }}</span
            >
            <div v-if="loading" class="scan-line"></div>
            <button
              v-if="!loading"
              type="button"
              class="preview-remove"
              aria-label="Remove selected image"
              @click="reset"
            >
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="file-info">
            <span class="file-icon"><AppIcon name="image" :size="19" /></span>
            <div>
              <strong :title="selectedFile?.name">{{
                selectedFile?.name
              }}</strong
              ><span>{{ fileSize }} <span>·</span> {{ imageSize }} px</span>
            </div>
            <span class="file-valid"><AppIcon name="check" :size="14" /></span>
          </div>
        </div>
        <div v-if="error" class="error-message" role="alert">
          <AppIcon name="alert" :size="18" />
          <p>{{ error }}</p>
          <button type="button" aria-label="Dismiss error" @click="error = ''">
            <AppIcon name="close" :size="15" />
          </button>
        </div>
        <div
          v-if="loading"
          class="loading-state"
          role="status"
          aria-live="polite"
        >
          <div>
            <span class="spinner"></span
            ><strong>{{
              elapsed >= 20
                ? "Still working on your image…"
                : "Analysis in progress"
            }}</strong
            ><span class="elapsed" aria-hidden="true">{{ elapsed }}s</span>
          </div>
          <div class="indeterminate-progress"></div>
          <p>
            {{
              elapsed >= 20
                ? "The first analysis can take longer while the model warms up."
                : "Please keep this page open while the model processes your X-ray."
            }}
          </p>
          <button type="button" class="text-button" @click="cancel">
            Cancel analysis
          </button>
        </div>
        <template v-else
          ><button
            class="analyze-button"
            type="button"
            :disabled="!selectedFile || validating"
            @click="analyze"
          >
            <AppIcon name="scan" :size="18" />{{
              error && selectedFile ? "Retry analysis" : "Analyze X-ray"
            }}<AppIcon name="arrow" :size="18" /></button
          ><button
            v-if="selectedFile"
            class="text-button replace-button"
            :disabled="busy"
            type="button"
            @click="fileInput?.click()"
          >
            Choose a different image
          </button></template
        >
        <p class="upload-note">
          <AppIcon name="shield" :size="15" /><span
            >Your image is sent to the analysis service only when you select
            Analyze.</span
          >
        </p>
      </template>
      <template v-else>
        <div class="completed-analysis">
          <span class="completion-seal"><AppIcon name="check" :size="25" /></span>
          <p class="completion-eyebrow" role="status">ANALYSIS COMPLETE</p>
          <h2 id="analyzer-title">Your results are ready.</h2>
          <p>Take a closer look at your image and the model’s findings.</p>
          <div class="completed-image">
            <img :src="previewUrl" alt="Analyzed chest X-ray thumbnail" />
            <div><span>FT-004 MODEL PREDICTION</span><strong>{{ PREDICTION_LABELS[result.label] }} pattern</strong><small :title="selectedFile?.name">{{ selectedFile?.name }}</small></div>
            <AppIcon name="file" :size="19" />
          </div>
          <button ref="viewResultButton" class="analyze-button" type="button" aria-haspopup="dialog" @click="resultOpen = true"><AppIcon name="scan" :size="18" />View full results<AppIcon name="arrow" :size="18" /></button>
          <button class="text-button" type="button" @click="reset">Start a new analysis</button>
        </div>
        <ResultCard
          :open="resultOpen"
          :result="result"
          :file-name="selectedFile?.name || 'X-ray'"
          :preview-url="previewUrl"
          :completed-at="completedAt"
          :image-size="imageSize"
          :file-size="fileSize"
          @close="closeResults"
          @reset="reset"
      /></template>
      <div class="panel-footnote">
        <AppIcon name="info" :size="14" /> Research use only. Always review with
        a qualified clinician.
      </div>
    </section>
  </div>
</template>

<style scoped>
.completed-analysis { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px 0 24px; text-align: center; }
.completion-seal { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; background: #edf4e9; color: #538064; box-shadow: 0 0 0 7px #f7faf4; margin-bottom: 23px; }
.completion-eyebrow { font-size: 9px; letter-spacing: 1.8px; color: #7b9270; }
.completed-analysis h2 { font-family: 'Manrope',sans-serif; font-size: 25px; letter-spacing: -.8px; font-weight: 550; margin: 9px 0; }
.completed-analysis > p:not(.completion-eyebrow) { color: #819075; font-size: 12px; line-height: 1.7; max-width: 280px; }
.completed-image { width: 100%; display: flex; align-items: center; gap: 15px; padding: 13px; background: #f7f9f3; border: 1px solid #e3e9dc; border-radius: 10px; margin: 26px 0 0; text-align: left; }
.completed-image img { width: 63px; height: 70px; object-fit: contain; border-radius: 5px; background: #192b25; }
.completed-image > div { min-width: 0; display: grid; gap: 7px; flex: 1; }
.completed-image span { color: #89997c; font-size: 8px; letter-spacing: 1.1px; }
.completed-image strong { font-size: 15px; font-weight: 500; color: #496343; }
.completed-image small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: #89977e; }
.completed-image > svg { color: #92a484; flex-shrink: 0; margin-right: 4px; }
.completed-analysis .text-button { margin-top: 17px; }
</style>
