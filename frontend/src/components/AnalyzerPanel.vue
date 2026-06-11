<template>
  <section class="analyzer-card" aria-labelledby="analyzer-title">
    <div class="card-header">
      <div>
        <p class="eyebrow">Analyzer</p>
        <h2 id="analyzer-title">Upload X-ray</h2>
      </div>
      <span class="status-chip" :class="apiStatusClass">
        <i class="pi pi-circle-fill" />
        {{ apiStatusLabel }}
      </span>
    </div>

    <FileUpload
      v-if="!previewUrl"
      ref="uploader"
      name="file"
      accept="image/jpeg,image/png"
      :maxFileSize="5000000"
      customUpload
      :auto="true"
      :showUploadButton="false"
      :showCancelButton="false"
      chooseLabel="Select X-ray"
      class="upload-box"
      @uploader="onUpload"
    >
      <template #empty>
        <div class="upload-empty">
          <i class="pi pi-cloud-upload" />
          <strong>Drop a chest X-ray here</strong>
          <span>JPEG or PNG, up to 5 MB</span>
        </div>
      </template>
    </FileUpload>

    <div v-if="previewUrl" class="preview-stage">
      <img :src="previewUrl" alt="Selected chest X-ray preview" />
      <button class="icon-button" type="button" aria-label="Clear selected image" @click="resetAll">
        <i class="pi pi-times" />
      </button>
    </div>

    <div v-if="loading" class="loading-state" aria-live="polite">
      <ProgressBar mode="indeterminate" class="analysis-progress" />
      <span>Analyzing image...</span>
    </div>

    <ResultCard v-if="result && !loading" :result="result" @reset="resetAll" />

    <div class="helper-row">
      <span><i class="pi pi-shield" /> Research aid only</span>
      <span><i class="pi pi-server" /> API: same server</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useToast } from "primevue/usetoast";
import ResultCard from "./ResultCard.vue";

type UploadEvent = {
  files: File | File[];
};

export type PredictionResult = {
  label: string;
  probability: number;
  threshold: number;
};

const API_URL = "/predict";

const toast = useToast();
const previewUrl = ref<string | null>(null);
const result = ref<PredictionResult | null>(null);
const loading = ref(false);
const apiStatus = ref<"idle" | "working" | "ready" | "error">("idle");
const uploader = ref<{ clear: () => void } | null>(null);

const apiStatusLabel = computed(() => {
  if (apiStatus.value === "working") return "Analyzing";
  if (apiStatus.value === "ready") return "Ready";
  if (apiStatus.value === "error") return "Needs attention";
  return "Waiting";
});

const apiStatusClass = computed(() => `status-${apiStatus.value}`);

const revokePreview = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
};

const onUpload = async (event: UploadEvent) => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  if (!file) return;

  revokePreview();
  previewUrl.value = URL.createObjectURL(file);
  result.value = null;
  loading.value = true;
  apiStatus.value = "working";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = typeof data?.detail === "string" ? data.detail : "Prediction failed. Please try another image.";
      throw new Error(detail);
    }

    result.value = data as PredictionResult;
    apiStatus.value = "ready";

    toast.add({
      severity: "success",
      summary: "Prediction complete",
      detail: `${result.value.label} at ${(result.value.probability * 100).toFixed(1)}% confidence`,
      life: 3600,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this image.";
    apiStatus.value = "error";
    toast.add({
      severity: "error",
      summary: "Analysis failed",
      detail: message,
      life: 5200,
    });
  } finally {
    loading.value = false;
  }
};

const resetAll = () => {
  revokePreview();
  previewUrl.value = null;
  result.value = null;
  loading.value = false;
  apiStatus.value = "idle";
  uploader.value?.clear();
};

onBeforeUnmount(revokePreview);
</script>
