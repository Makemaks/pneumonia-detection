<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import { CLASS_ORDER, PREDICTION_LABELS, type PredictionResult } from "../lib/prediction";
const props = defineProps<{
  open: boolean; result: PredictionResult; fileName: string; previewUrl: string;
  completedAt: string; imageSize: string; fileSize: string;
}>();
const emit = defineEmits<{ reset: []; close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const heading = ref<HTMLElement | null>(null);
let previousOverflow: string | undefined;
const positive = computed(() => props.result.label !== "NORMAL");
const predictionLabel = computed(() => PREDICTION_LABELS[props.result.label]);
const winningScore = computed(() => (props.result.probabilities[props.result.label] * 100).toFixed(1));
const scores = computed(() => CLASS_ORDER.map((label) => ({
  label, name: PREDICTION_LABELS[label], score: (props.result.probabilities[label] * 100).toFixed(1),
})));
const tied = computed(() => CLASS_ORDER.filter((label) =>
  props.result.probabilities[label] === props.result.probabilities[props.result.label],
).length > 1);
const dateLabel = computed(() => new Date(props.completedAt).toLocaleString([], {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
}));
function restoreScrolling() {
  if (previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
  }
}
async function syncDialog() {
  if (!dialog.value) return;
  if (props.open && !dialog.value.open) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.value.showModal();
    await nextTick();
    if (props.open) heading.value?.focus({ preventScroll: true });
  } else if (!props.open && dialog.value.open) {
    dialog.value.close();
    restoreScrolling();
  }
}
function onNativeClose() {
  restoreScrolling();
  if (props.open) emit("close");
}
function onBackdropClick(event: MouseEvent) {
  if (event.target !== dialog.value || !dialog.value) return;
  const rect = dialog.value.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) emit("close");
}
function onDialogKeydown(event: KeyboardEvent) {
  if (event.key !== "Tab" || !dialog.value) return;
  const buttons = [...dialog.value.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.value)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
watch(() => props.open, syncDialog, { flush: "post" });
onMounted(syncDialog);
onBeforeUnmount(() => { dialog.value?.close(); restoreScrolling(); });
function downloadReport() {
  const report = [
    "PULMO — CHEST X-RAY ANALYSIS",
    "Research and education only. Not a medical diagnosis.", "",
    `Image: ${props.fileName}`,
    `Analyzed: ${new Date(props.completedAt).toLocaleString()}`,
    `Model: ${props.result.model} — ${props.result.member_count} × DenseNet201 ensemble`,
    `Model version: ${props.result.model_version}`,
    `Prediction: ${predictionLabel.value} (${props.result.label})`,
    ...scores.value.map((item) => `${item.name} model score: ${item.score}%`),
    "Selection rule: highest equally averaged model score; exact ties follow Normal, Viral, Bacterial class order.",
    "Each score is the equal mean of the three models' scores for that class.", "",
    "Scores are model outputs, not calibrated clinical probabilities or measures of diagnostic certainty.",
    "A normal prediction does not rule out pneumonia or another condition. Review with a qualified clinician.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pulmo-analysis-${new Date(props.completedAt).toLocaleDateString("en-CA")}.txt`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="analysis-dialog" aria-labelledby="analysis-result-title" @cancel.prevent="emit('close')" @close="onNativeClose" @click="onBackdropClick" @keydown="onDialogKeydown">
      <div class="result-sheet">
        <header class="result-sheet-header">
          <div class="result-heading-icon"><AppIcon name="file" :size="21" /></div>
          <div><p class="result-kicker">YOUR IMAGE, A CLOSER LOOK</p><h2 id="analysis-result-title" ref="heading" tabindex="-1">Analysis results</h2></div>
          <span class="result-ready"><span></span>Analysis complete</span>
          <button class="result-close" type="button" aria-label="Close results" @click="emit('close')"><AppIcon name="close" :size="19" /></button>
        </header>
        <div class="result-sheet-body">
          <figure class="result-radiograph">
            <div class="radiograph-top"><span><AppIcon name="scan" :size="14" />CHEST X-RAY</span><span>ORIGINAL IMAGE</span></div>
            <div class="radiograph-canvas"><img :src="previewUrl" alt="Original chest X-ray submitted for this analysis" /><i class="image-corner corner-tl"></i><i class="image-corner corner-tr"></i><i class="image-corner corner-bl"></i><i class="image-corner corner-br"></i></div>
            <figcaption><div><AppIcon name="image" :size="16" /><strong :title="fileName">{{ fileName }}</strong></div><span>{{ imageSize }} px <b>·</b> {{ fileSize }}</span></figcaption>
            <p class="radiograph-note"><AppIcon name="clock" :size="12" />Analyzed {{ dateLabel }}</p>
          </figure>
          <section class="result-findings" aria-labelledby="prediction-title" :class="{ 'is-positive': positive }">
            <div class="finding-label"><span class="finding-symbol"><AppIcon :name="positive ? 'scan' : 'check'" :size="16" /></span>MODEL PREDICTION<span class="model-type">FT-004</span></div>
            <h3 id="prediction-title">{{ predictionLabel }} pattern</h3>
            <p class="finding-description">Three DenseNet201 models classified this image by averaging their scores equally.</p>
            <div class="primary-score"><div><span>{{ predictionLabel }} model score</span><strong>{{ winningScore }}<small>%</small></strong></div><span class="score-tag">{{ tied ? 'Tied highest scores' : 'Highest mean score' }}</span></div>
            <div class="result-score-breakdown" aria-label="Model score breakdown">
              <div class="breakdown-heading"><h4>Score breakdown</h4><span>0–100%</span></div>
              <div v-for="item in scores" :key="item.label" class="result-score-row" :class="item.label.toLowerCase()">
                <div class="result-score-line"><span><i></i>{{ item.name }}</span><strong>{{ item.score }}%</strong></div>
                <div class="result-score-track" role="meter" :aria-label="`${item.name} model score`" :aria-valuenow="Number(item.score)" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: `${item.score}%` }"></span></div>
              </div>
              <p class="result-ensemble"><span>3 × DenseNet201</span>Equal score averaging · highest class selected</p>
            </div>
            <div class="result-interpretation"><AppIcon name="info" :size="16" /><p><strong>{{ tied ? 'The highest scores are tied.' : 'Keep the scores in context.' }}</strong> {{ tied ? 'The displayed label follows the recorded class order. Scores do not establish diagnostic certainty.' : 'Scores describe the model’s output, not diagnostic certainty. A normal result does not rule out illness.' }}</p></div>
          </section>
        </div>
        <footer class="result-sheet-footer">
          <p><AppIcon name="shield" :size="17" /><span>For research & education.<br /><strong>Review with a qualified clinician.</strong></span></p>
          <div class="result-footer-actions"><button class="result-secondary" type="button" @click="downloadReport"><AppIcon name="download" :size="16" />Save report</button><button class="result-primary" type="button" @click="emit('reset')"><AppIcon name="plus" :size="16" />New analysis</button></div>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.analysis-dialog { width: min(980px,calc(100vw - 64px)); max-width: none; max-height: calc(100dvh - 48px); margin: auto; padding: 0; border: 1px solid #d9e2d3; border-radius: 20px; background: #fcfdf9; color: #304b3c; box-shadow: 0 30px 100px #102e3650; overflow: auto; }
.analysis-dialog::backdrop { background: #142c27a6; backdrop-filter: blur(7px); }
.analysis-dialog[open] { animation: result-reveal .3s cubic-bezier(.2,.8,.2,1) both; }
.analysis-dialog[open]::backdrop { animation: backdrop-reveal .25s ease both; }
.result-sheet-header { display: flex; align-items: center; gap: 14px; padding: 19px 28px; border-bottom: 1px solid #e3e9db; }
.result-heading-icon { width: 44px; height: 44px; display: grid; place-items: center; border: 1px solid #dce6d3; border-radius: 13px; color: #6a8b57; background: #f0f5e9; }
.result-kicker { font-size: 9px; letter-spacing: 1.7px; color: #6e7d61; margin: 0 0 5px; }
.result-sheet-header h2 { font: 550 23px 'Manrope',sans-serif; letter-spacing: -.65px; margin: 0; outline: none; }
.result-ready { display: flex; gap: 7px; align-items: center; margin-left: auto; padding: 7px 11px; border-radius: 20px; background: #edf4e8; color: #536f42; font-size: 11px; }
.result-ready > span { width: 5px; height: 5px; border-radius: 50%; background: #6e9660; }
.result-close { display: grid; place-items: center; width: 34px; height: 34px; margin-left: 4px; background: transparent; color: #879681; border: 1px solid #e3e9dc; border-radius: 9px; }
.result-close:hover { background: #eaf0e2; color: #365e44; }
.result-sheet-body { display: grid; grid-template-columns: .94fr 1.06fr; gap: 33px; padding: 20px 28px; }
.result-radiograph { margin: 0; display: flex; flex-direction: column; min-width: 0; border-radius: 13px; background: #1b2d27; color: #cbd7bd; overflow: hidden; }
.radiograph-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 19px 19px 0; font-size: 8px; letter-spacing: 1.2px; }
.radiograph-top > span:first-child { display: flex; gap: 7px; align-items: center; }.radiograph-top > span:last-child { color: #829581; font-size: 7px; }
.radiograph-canvas { position: relative; flex: 1; display: grid; place-items: center; min-height: 230px; margin: 20px 19px 14px; background: radial-gradient(ellipse,#304337,#172821); border-radius: 3px; }
.radiograph-canvas img { width: 100%; height: 280px; max-height: 34dvh; object-fit: contain; padding: 12px; }
.image-corner { position: absolute; width: 16px; height: 16px; border-color: #84987c; border-style: solid; opacity: .65; }
.corner-tl { left: 0; top: 0; border-width: 1px 0 0 1px; }.corner-tr { right: 0; top: 0; border-width: 1px 1px 0 0; }.corner-bl { left: 0; bottom: 0; border-width: 0 0 1px 1px; }.corner-br { right: 0; bottom: 0; border-width: 0 1px 1px 0; }
.result-radiograph figcaption { margin: 0 19px; padding: 15px 0 0; border-top: 1px solid #778e6938; }.result-radiograph figcaption > div { display: flex; gap: 9px; align-items: center; }
.result-radiograph figcaption strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 450; color: #d2dfc5; }.result-radiograph figcaption svg { flex-shrink: 0; color: #829e79; }
.result-radiograph figcaption > span { display: block; font-size: 10px; color: #afbea5; margin: 7px 0 0 25px; }.result-radiograph figcaption b { padding: 0 6px; font-weight: 400; }
.radiograph-note { display: flex; gap: 7px; align-items: center; margin: 16px 19px; font-size: 10px; color: #a6b79e; }
.result-findings { min-width: 0; padding: 3px 1px; }.finding-label { display: flex; gap: 8px; align-items: center; color: #657a59; font-size: 9px; letter-spacing: 1.4px; }
.finding-symbol { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #eaf2e2; color: #5e824e; }.is-positive .finding-symbol { color: #997b42; background: #f5edd9; }
.model-type { margin-left: auto; font-size: 10px; letter-spacing: 0; color: #6d7e60; }.result-findings h3 { font: 550 27px 'Manrope',sans-serif; letter-spacing: -.8px; line-height: 1.3; margin: 13px 0 7px; }.finding-description { color: #68795c; font-size: 12px; line-height: 1.7; margin: 0; }
.primary-score { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 14px 0; padding-bottom: 12px; border-bottom: 1px solid #e0e7d9; }.primary-score > div > span { display: block; color: #617954; font-size: 11px; margin-bottom: 5px; }
.primary-score strong { font: 550 48px 'Manrope',sans-serif; line-height: 1.1; letter-spacing: -2px; color: #3c6744; }.is-positive .primary-score strong { color: #8b743f; }.primary-score strong small { font-size: 24px; letter-spacing: -1px; font-weight: 400; margin-left: 3px; color: #97a78b; }
.score-tag { padding: 6px 9px; background: #f0f3e9; color: #62754f; border-radius: 5px; font-size: 9px; margin-bottom: 3px; }.is-positive .score-tag { color: #806831; background: #f8f1df; }
.breakdown-heading,.result-score-line { display: flex; justify-content: space-between; align-items: center; }.breakdown-heading { margin-bottom: 11px; }.breakdown-heading h4 { font-size: 12px; font-weight: 550; margin: 0; color: #5b7450; }.breakdown-heading > span { font-size: 10px; color: #6c7c5f; }
.result-score-line { font-size: 11px; color: #5c7352; margin-bottom: 7px; }.result-score-line > span { display: flex; gap: 7px; align-items: center; }.result-score-line strong { font-weight: 500; font-variant-numeric: tabular-nums; color: #536f48; }.result-score-line i { width: 5px; height: 5px; border-radius: 50%; }.viral .result-score-line i { background: #7896aa; }.bacterial .result-score-line i { background: #b69d62; }.normal .result-score-line i { background: #719b79; }
.result-score-track { height: 7px; background: #e9ede1; border-radius: 3px; position: relative; margin-bottom: 10px; }.result-score-track > span { display: block; height: 100%; border-radius: 3px; transform-origin: left; }.analysis-dialog[open] .result-score-track > span { animation: score-reveal .65s .1s both; }.viral .result-score-track > span { background: #7896aa; }.bacterial .result-score-track > span { background: #b5a06c; }.normal .result-score-track > span { background: #7e9f76; }
.result-ensemble { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 9px; color: #6d7b60; margin: 8px 0 0; }.result-ensemble > span { padding: 4px 6px; border: 1px solid #dfe7d5; border-radius: 4px; color: #5b7650; }
.result-interpretation { display: flex; align-items: flex-start; gap: 9px; background: #f0f4e9; border: 1px solid #e4ebda; border-radius: 8px; padding: 9px 12px; margin-top: 12px; color: #637950; }.result-interpretation > svg { flex-shrink: 0; margin-top: 2px; }.result-interpretation p { font-size: 11px; line-height: 1.65; margin: 0; }.result-interpretation strong { color: #67805a; font-weight: 550; }
.result-sheet-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 16px 28px; background: #f5f8ef; border-top: 1px solid #e1e8d8; }.result-sheet-footer > p { display: flex; align-items: center; gap: 10px; font-size: 10px; line-height: 1.65; color: #697f59; margin: 0; }.result-sheet-footer > p strong { font-weight: 400; color: #738a62; }
.result-footer-actions { display: flex; gap: 10px; }.result-footer-actions button { display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 7px; padding: 12px 17px; font-size: 12px; font-weight: 450; transition: background .15s,transform .15s; }.result-footer-actions button:hover { transform: translateY(-1px); }.result-secondary { background: #fcfdf8; color: #607c51; border: 1px solid #d9e4cd; }.result-secondary:hover { background: #eaf0e1; }.result-primary { color: #fff; background: #32694f; border: 1px solid #32694f; }.result-primary:hover { background: #255940; }
@keyframes result-reveal { from { opacity: 0; transform: translateY(18px) scale(.975); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes backdrop-reveal { from { opacity: 0; } to { opacity: 1; } }
@keyframes score-reveal { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .analysis-dialog[open],.analysis-dialog[open]::backdrop,.analysis-dialog[open] .result-score-track > span { animation: none; }.result-footer-actions button { transition: none; } }
</style>
