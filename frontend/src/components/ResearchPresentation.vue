<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import ResearchMedia from "./ResearchMedia.vue";
import { researchSlides } from "../content/researchPresentation";
import { researchSources } from "../content/researchContent";

const current = ref(0);
const direction = ref("slide-next");
watch(current, (next, previous) => { direction.value = next >= previous ? "slide-next" : "slide-previous"; }, { flush: "sync" });
const presenting = ref(false);
const showOutline = ref(false);
const presentationRoot = ref<HTMLElement | null>(null);
const presentButton = ref<HTMLButtonElement | null>(null);
const slide = computed(() => researchSlides[current.value]!);
const slideNumber = computed(() => String(current.value + 1).padStart(2, "0"));
let previousOverflow = "";

function selectSlide(index: number) {
  current.value = Math.max(0, Math.min(researchSlides.length - 1, index));
  showOutline.value = false;
}

async function exitPresentation() {
  presenting.value = false;
  showOutline.value = false;
  await nextTick();
  presentButton.value?.focus({ preventScroll: true });
}

function togglePresentation() {
  if (presenting.value) void exitPresentation();
  else presenting.value = true;
}

async function followReference(id: number) {
  presenting.value = false;
  showOutline.value = false;
  await nextTick();
  window.location.hash = `research-source-${id}`;
  const reference = document.getElementById(`research-source-${id}`);
  reference?.scrollIntoView({ behavior: "instant", block: "start" });
  reference?.focus({ preventScroll: true });
}

function handleKey(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  if (event.key === "Escape") {
    if (presenting.value) void exitPresentation();
    else showOutline.value = false;
    return;
  }
  if (presenting.value && event.key === "Tab") {
    const controls = Array.from(presentationRoot.value?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), select") ?? []).filter((element) => element.offsetWidth > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (event.target === first || event.target === presentationRoot.value)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first?.focus();
    }
    return;
  }
  if ((event.target as HTMLElement).tagName === "SELECT") return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    selectSlide(current.value + (event.key === "ArrowRight" ? 1 : -1));
  }
}

function sourceLabel(id: number) {
  return `Reference ${id}: ${researchSources.find((source) => source.id === id)?.title ?? "Research source"}`;
}

function scoreWidth(value: string) {
  return `${Math.max(0, Math.min(100, Number.parseFloat(value)))}%`;
}

watch(presenting, async (active) => {
  if (active) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    presentationRoot.value?.focus();
  } else {
    document.body.style.overflow = previousOverflow;
  }
});

onBeforeUnmount(() => {
  if (presenting.value) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <section
    ref="presentationRoot"
    id="research-presentation"
    class="research-presentation"
    :class="{ presenting }"
    aria-label="Research presentation"
    :role="presenting ? 'dialog' : 'region'"
    :aria-modal="presenting ? true : undefined"
    :aria-roledescription="presenting ? undefined : 'carousel'"
    tabindex="0"
    @keydown="handleKey"
  >
    <div class="deck-toolbar">
      <div class="deck-label">
        <span class="deck-symbol"><AppIcon name="layers" :size="19" /></span>
        <div><strong>Research walkthrough</strong><span>One idea at a time · 16 slides</span></div>
      </div>
      <div class="deck-tools">
        <select v-model.number="current" aria-label="Choose research slide">
          <option v-for="(item, index) in researchSlides" :key="item.title" :value="index">
            {{ String(index + 1).padStart(2, "0") }} · {{ item.title }}
          </option>
        </select>
        <button ref="presentButton" class="present-button" type="button" :aria-pressed="presenting" @click="togglePresentation">
          <AppIcon :name="presenting ? 'close' : 'play'" :size="15" />
          {{ presenting ? "Exit presentation" : "Present" }}
        </button>
      </div>
    </div>

    <div class="deck-frame">
      <div class="slide-topline">
        <span>pulmo<span class="brand-dot">.</span> <i></i> THE RESEARCH</span>
        <span>{{ slide.chapter }} <b>{{ slideNumber }} / {{ researchSlides.length }}</b></span>
      </div>

      <div class="slide-stage">
      <Transition :name="direction" mode="out-in">
      <article
        :key="current"
        class="deck-slide"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${current + 1} of ${researchSlides.length}: ${slide.title}`"
      >
        <div class="slide-copy">
          <p class="slide-chapter">{{ slide.chapter }}</p>
          <h2>{{ slide.title }}</h2>
          <p class="slide-lead">{{ slide.lead }}</p>
          <ul class="slide-points">
            <li v-for="point in slide.points" :key="point">{{ point }}</li>
          </ul>
          <div class="slide-takeaway"><AppIcon name="check" :size="17" /><p>{{ slide.takeaway }}</p></div>
        </div>

        <figure class="slide-visual" :class="`visual-kind-${slide.visual}`">
          <figcaption>{{ slide.visualTitle }}</figcaption>

          <ResearchMedia v-if="['lungs','imagery','distribution','uncertainty'].includes(slide.visual)" :kind="slide.visual" />
          <template v-else-if="slide.visual === 'ensemble'">
            <div class="ensemble-input"><AppIcon name="image" :size="22" /><strong>The same chest X-ray</strong></div>
            <div class="ensemble-branches">
              <div v-for="item in slide.items" :key="item.label" class="ensemble-branch">
                <span>{{ item.label }}</span><h3>{{ item.value }}</h3>
                <div class="network-token"><AppIcon name="layers" :size="17" />DenseNet-201</div>
                <p>{{ item.detail }}</p>
              </div>
            </div>
            <div class="ensemble-output"><span>Average the three probability vectors equally</span><strong>Return the highest averaged class</strong></div>
          </template>

          <template v-else-if="slide.visual === 'rates'">
            <div class="rate-comparison">
              <div v-for="(item, index) in slide.items" :key="item.label" class="rate-card" :class="{ 'rate-candidate': index === 1 }">
                <h3>{{ item.label }}</h3>
                <span class="rate-role">BACKBONE</span><strong>{{ item.value }}</strong>
                <div class="rate-track"><span :style="{ width: index === 0 ? '100%' : '10%' }"></span></div>
                <p class="rate-role">CLASSIFIER</p><b>0.0001</b>
                <div class="rate-track"><span style="width:100%"></span></div>
              </div>
            </div>
            <div class="rate-ratio"><strong>10× smaller backbone rate</strong><span>All layers remain trainable</span></div>
          </template>

          <template v-else-if="slide.visual === 'scores'">
            <div class="score-rows">
              <div v-for="item in slide.items" :key="item.label" class="score-row">
                <div><h3>{{ item.label }}</h3><strong>{{ item.value }}</strong></div>
                <p>{{ item.detail }}</p>
                <div class="score-track"><span :style="{ width: scoreWidth(item.value) }"></span></div>
              </div>
              <div class="score-axis"><span>0%</span><span>100%</span></div>
            </div>
          </template>

          <template v-else-if="slide.visual === 'split'">
            <div class="split-bar" aria-hidden="true"><span></span><span></span><span></span></div>
            <div class="split-rows">
              <div v-for="item in slide.items" :key="item.label" class="split-row">
                <div><h3>{{ item.label }}</h3><strong>{{ item.value }}</strong></div><p>{{ item.detail }}</p>
              </div>
            </div>
          </template>

          <template v-else-if="slide.visual === 'tiles'">
            <div class="visual-tiles" :class="{ 'three-tiles': slide.items.length === 3 }">
              <div v-for="item in slide.items" :key="item.label" class="visual-tile">
                <span>{{ item.label }}</span><h3>{{ item.value }}</h3><p>{{ item.detail }}</p>
              </div>
            </div>
          </template>

          <template v-else>
            <ol class="visual-flow" :class="{ 'decision-flow': slide.visual === 'gate', 'flow-four': slide.items.length === 4 }">
              <li v-for="(item, index) in slide.items" :key="item.label">
                <span class="flow-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <div><span v-if="item.label !== String(index + 1).padStart(2, '0')">{{ item.label }}</span><h3>{{ item.value }}</h3><p>{{ item.detail }}</p></div>
              </li>
            </ol>
          </template>

          <p v-if="slide.visualNote" class="visual-note">{{ slide.visualNote }}</p>
        </figure>
      </article>
      </Transition>
      </div>

      <div class="slide-bottomline">
        <div class="slide-citations"><span>Sources</span>
          <a v-for="source in slide.sources" :key="source" :href="`#research-source-${source}`" :aria-label="sourceLabel(source)" @click.prevent="followReference(source)">[{{ source }}]</a>
        </div>
        <span>Documented study · FT-011 results pending</span>
      </div>
    </div>

    <div class="deck-controls">
      <button class="slide-nav" type="button" :disabled="current === 0" @click="selectSlide(current - 1)"><AppIcon class="previous-arrow" name="arrow" :size="17" />Previous</button>
      <div class="deck-position">
        <button class="outline-button" type="button" :aria-expanded="showOutline" aria-controls="research-slide-outline" @click="showOutline = !showOutline">{{ slideNumber }} / {{ researchSlides.length }} <AppIcon name="layers" :size="15" /></button>
        <span class="keyboard-hint">Use ← and → inside the presentation</span>
        <span class="visually-hidden" aria-live="polite">Slide {{ current + 1 }} of {{ researchSlides.length }}: {{ slide.title }}</span>
      </div>
      <button class="slide-nav next-slide" type="button" :disabled="current === researchSlides.length - 1" @click="selectSlide(current + 1)">Next slide<AppIcon name="arrow" :size="17" /></button>
    </div>
    <div class="deck-progress" aria-hidden="true"><span :style="{ width: `${((current + 1) / researchSlides.length) * 100}%` }"></span></div>
    <nav v-if="showOutline" id="research-slide-outline" class="slide-outline" aria-label="Research slide overview">
      <button v-for="(item, index) in researchSlides" :key="item.title" type="button" :aria-current="index === current ? 'step' : undefined" @click="selectSlide(index)"><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ item.title }}</button>
    </nav>
  </section>
</template>

<style scoped>
.slide-stage { display: grid; min-height: 510px; overflow: hidden; }
.slide-stage > .deck-slide { grid-area: 1 / 1; }
.slide-next-enter-active,.slide-previous-enter-active { transition: opacity 280ms ease, transform 350ms cubic-bezier(.2,.7,.2,1); }
.slide-next-leave-active,.slide-previous-leave-active { transition: opacity 160ms ease, transform 180ms ease; }
.slide-next-enter-from { opacity:0; transform:translateX(32px); }
.slide-next-leave-to { opacity:0; transform:translateX(-24px); }
.slide-previous-enter-from { opacity:0; transform:translateX(-32px); }
.slide-previous-leave-to { opacity:0; transform:translateX(24px); }
.deck-slide .score-track span,.deck-slide .rate-track span { transform-origin:left; animation:grow-chart 650ms cubic-bezier(.2,.7,.2,1) both; }
.deck-slide .slide-points li { animation:reveal-point 450ms ease both; }
.deck-slide .slide-points li:nth-child(2) { animation-delay:70ms; }
.deck-slide .slide-points li:nth-child(3) { animation-delay:140ms; }
@keyframes grow-chart { from { transform:scaleX(0); } to { transform:scaleX(1); } }
@keyframes reveal-point { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
.presenting .slide-stage { flex:1; min-height:0; }
.presenting .slide-stage > .deck-slide { height:100%; box-sizing:border-box; }
@media (prefers-reduced-motion:reduce) {
  .slide-next-enter-active,.slide-next-leave-active,.slide-previous-enter-active,.slide-previous-leave-active { transition:none; }
  .slide-next-enter-from,.slide-next-leave-to,.slide-previous-enter-from,.slide-previous-leave-to { transform:none; }
  .deck-slide .score-track span,.deck-slide .rate-track span,.deck-slide .slide-points li { animation:none; }
}
.research-presentation { margin-top: 28px; scroll-margin-top: 24px; outline: none; }
.research-presentation:focus-visible { outline: 2px solid #74a58d; outline-offset: 5px; border-radius: 14px; }
.deck-toolbar, .deck-tools, .deck-label, .deck-controls, .slide-topline, .slide-bottomline { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.deck-toolbar { margin-bottom: 15px; }
.deck-label { justify-content: flex-start; gap: 11px; }
.deck-symbol { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #dce5d7; border-radius: 10px; color: #64805b; background: #edf2e8; }
.deck-label strong, .deck-label span { display: block; }
.deck-label strong { color: #304b38; font-size: 13px; font-weight: 600; }
.deck-label div > span { margin-top: 3px; color: #7b8874; font-size: 11px; }
.deck-tools { gap: 10px; }
.deck-tools select { max-width: 330px; padding: 11px 30px 11px 12px; border: 1px solid #dfe5d9; border-radius: 7px; background: #fafbf7; color: #5c7154; font: inherit; font-size: 11px; cursor: pointer; }
.present-button, .slide-nav, .outline-button { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 40px; border: 1px solid #d5dfce; border-radius: 7px; padding: 9px 15px; background: #fafbf7; color: #396445; font: inherit; font-size: 12px; cursor: pointer; }
.present-button { background: #286653; color: white; border-color: #286653; }
.present-button:hover, .next-slide:hover { background: #1c5141; color: white; }
.deck-frame { position: relative; overflow: hidden; border: 1px solid #d7e1ce; border-radius: 14px; background: #fafbf6; box-shadow: 0 8px 30px #334e3110; }
.slide-topline { padding: 20px 29px 13px; color: #7b8d70; font-size: 10px; }
.slide-topline > span:first-child { display: inline-flex; align-items: center; gap: 13px; color: #557050; font-weight: 600; letter-spacing: .8px; }
.brand-dot { color: #6b9970; margin-left: -13px; }
.slide-topline i { width: 1px; height: 13px; background: #dce4d4; }
.slide-topline b { margin-left: 20px; font-weight: 500; font-variant-numeric: tabular-nums; }
.deck-slide { display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr); align-items: center; gap: 40px; min-height: 510px; padding: 22px 38px 28px; }
.slide-copy { min-width: 0; }
.slide-chapter { margin-bottom: 10px; text-transform: uppercase; color: #6d895f; letter-spacing: 1.5px; font-size: 10px; font-weight: 600; }
.slide-copy h2 { max-width: 540px; color: #284a35; font-size: clamp(26px, 2.7vw, 37px); font-weight: 550; letter-spacing: -1.1px; line-height: 1.25; }
.slide-lead { margin: 17px 0 19px; color: #536d4e; font-size: 14px; line-height: 1.75; }
.slide-points { display: grid; gap: 12px; padding: 0; margin: 0; list-style: none; }
.slide-points li { position: relative; padding-left: 18px; color: #66775e; font-size: 12px; line-height: 1.8; }
.slide-points li::before { content: ''; position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #8da17c; left: 0; top: 9px; }
.slide-takeaway { display: flex; align-items: flex-start; gap: 10px; margin-top: 23px; padding: 13px 15px; border-left: 2px solid #79a570; background: #edf3e6; border-radius: 0 6px 6px 0; color: #456642; }
.slide-takeaway svg { flex-shrink: 0; margin-top: 2px; }
.slide-takeaway p { font-size: 12px; line-height: 1.75; }
.slide-visual { min-width: 0; margin: 0; padding: 26px; border: 1px solid #dbe5d2; border-radius: 12px; background: linear-gradient(135deg, #eff4e8, #e7efdf); }
.slide-visual figcaption { margin-bottom: 22px; color: #607958; font-size: 11px; font-weight: 600; line-height: 1.7; }
.visual-tiles { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
.visual-tile { min-width: 0; padding: 18px 15px; border: 1px solid #d5e0c9; border-radius: 9px; background: #f9fbf4; }
.visual-tile > span, .flow-number + div > span, .ensemble-branch > span { color: #79916a; font-size: 10px; line-height: 1.7; }
.visual-tile h3 { margin: 10px 0 8px; color: #395a38; font-size: 21px; font-weight: 550; letter-spacing: -.5px; line-height: 1.3; overflow-wrap: anywhere; }
.visual-tile p, .visual-flow p, .ensemble-branch p, .score-row p, .split-row p { color: #75866a; font-size: 11px; line-height: 1.7; }
.three-tiles { grid-template-columns: minmax(0,1fr); }
.three-tiles .visual-tile { display: grid; grid-template-columns: 1fr auto; gap: 3px 18px; align-items: center; }
.three-tiles h3 { grid-column: 2; grid-row: 1 / 3; font-size: 30px; margin: 0; }
.visual-flow { margin: 0; padding: 0; list-style: none; display: grid; gap: 20px; }
.visual-flow li { display: flex; position: relative; align-items: center; gap: 13px; padding: 13px 15px; border: 1px solid #d1dec5; border-radius: 9px; background: #f9fbf4; }
.visual-flow li:not(:last-child)::after { content: '↓'; position: absolute; left: 28px; bottom: -21px; color: #88a075; font-size: 16px; }
.flow-number { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; background: #e9f0df; color: #779367; font-size: 10px; }
.visual-flow h3 { margin: 3px 0; color: #365a38; font-size: 16px; font-weight: 550; line-height: 1.5; letter-spacing: -.25px; }
.flow-four { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px; }
.flow-four li { flex-direction: column; align-items: flex-start; gap: 8px; padding: 14px; }
.flow-four li:not(:last-child)::after { display: none; }
.flow-four h3 { font-size: 14px; }
.visual-note { margin-top: 18px; color: #78896e; font-size: 10px; line-height: 1.75; }
.split-bar { display: flex; height: 18px; border-radius: 6px; overflow: hidden; gap: 3px; margin-bottom: 23px; }
.split-bar span:nth-child(1) { width: 70%; background: #597d50; }
.split-bar span:nth-child(2) { width: 15%; background: #91aa79; }
.split-bar span:nth-child(3) { width: 15%; background: #bacba9; }
.split-rows { display: grid; gap: 15px; }
.split-row { padding: 12px 15px; border-left: 3px solid #597d50; background: #f9fbf4; border-radius: 0 7px 7px 0; }
.split-row:nth-child(2) { border-color: #91aa79; }
.split-row:nth-child(3) { border-color: #bacba9; }
.split-row > div, .score-row > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.split-row h3, .score-row h3 { color: #405f3f; font-size: 12px; font-weight: 500; line-height: 1.6; }
.split-row strong { color: #3e653e; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 23px; }
.split-row p { margin-top: 4px; }
.score-rows { display: grid; gap: 23px; }
.score-row strong { color: #416d43; font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 600; white-space: nowrap; }
.score-row p { margin: 5px 0 12px; }
.score-track, .rate-track { height: 9px; border-radius: 3px; background: #d7e1ce; overflow: hidden; }
.score-track span, .rate-track span { display: block; height: 100%; background: #759963; border-radius: 3px; }
.score-row:first-child .score-track span { background: #416b43; }
.score-axis { display: flex; justify-content: space-between; margin-top: -14px; color: #8e9c84; font-size: 9px; }
.ensemble-input { display: flex; align-items: center; justify-content: center; gap: 9px; padding: 11px; background: #f9fbf4; border: 1px solid #d2dfc6; border-radius: 9px; color: #5f7e51; }
.ensemble-input strong { font-size: 12px; font-weight: 500; }
.ensemble-branches { position: relative; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin: 22px 0; }
.ensemble-branches::before, .ensemble-branches::after { content: ''; position: absolute; left: 16%; right: 16%; height: 14px; border: 1px solid #a8bd96; border-bottom: 0; top: -15px; }
.ensemble-branches::after { top: auto; bottom: -15px; transform: rotate(180deg); }
.ensemble-branch { padding: 15px 9px; border: 1px solid #d3dfc9; border-radius: 8px; background: #f9fbf4; text-align: center; }
.ensemble-branch h3 { min-height: 44px; margin: 8px 0 12px; color: #446542; font-size: 12px; line-height: 1.7; font-weight: 600; }
.network-token { display: flex; align-items: center; justify-content: center; gap: 5px; margin: 10px 0; padding: 9px 4px; border-radius: 6px; background: #eaf1e2; color: #6c855d; font-size: 9px; }
.ensemble-branch p { font-size: 9px; }
.ensemble-output { display: grid; gap: 7px; padding: 16px; text-align: center; border-radius: 8px; background: #4e7549; color: #e6eedf; font-size: 11px; }
.ensemble-output strong { font-weight: 500; color: #f6faef; font-size: 12px; }
.rate-comparison { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px; }
.rate-card { padding: 19px 16px; border: 1px solid #d1ddc5; border-radius: 9px; background: #f9fbf4; }
.rate-card h3 { min-height: 44px; margin-bottom: 18px; color: #6d855f; font-size: 11px; line-height: 1.7; font-weight: 500; }
.rate-role { display: block; color: #8a9b7c; font-size: 8px; letter-spacing: 1px; }
.rate-card strong { display: block; margin: 6px 0 13px; color: #42683c; font-family: 'Manrope',sans-serif; font-size: 23px; font-weight: 600; letter-spacing: -.7px; }
.rate-card b { display: block; margin: 6px 0 12px; color: #5f7f51; font-size: 18px; font-weight: 500; }
.rate-card p.rate-role { margin-top: 23px; }
.rate-candidate { border-color: #9db88b; background: #edf4e5; }
.rate-ratio { display: grid; gap: 6px; text-align: center; margin-top: 20px; color: #567b47; }
.rate-ratio strong { font-size: 14px; font-weight: 500; }
.rate-ratio span { font-size: 11px; color: #7c906d; }
.slide-bottomline { padding: 13px 29px; border-top: 1px solid #e3e9db; color: #89967f; font-size: 9px; }
.slide-citations { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.slide-citations > span { margin-right: 5px; }
.slide-citations a { display: grid; place-items: center; min-width: 28px; min-height: 28px; border-radius: 5px; color: #52774b; font-size: 11px; }
.slide-citations a:hover { background: #e9f0e1; text-decoration: underline; }
.deck-controls { padding: 16px 0 13px; }
.slide-nav:disabled { color: #aab3a2; border-color: #e4e8de; cursor: default; background: #f5f7f0; }
.previous-arrow { transform: rotate(180deg); }
.next-slide { background: #286653; border-color: #286653; color: white; }
.next-slide:disabled:hover { background: #f5f7f0; color: #aab3a2; }
.deck-position { display: flex; align-items: center; gap: 15px; }
.outline-button { border-color: transparent; background: transparent; min-height: 36px; color: #6d815f; font-size: 11px; }
.outline-button:hover { border-color: #d5dfce; background: #edf3e5; }
.keyboard-hint { color: #98a08f; font-size: 10px; }
.deck-progress { height: 3px; overflow: hidden; border-radius: 3px; background: #e0e7d7; }
.deck-progress > span { display: block; height: 100%; background: #779e65; transition: width .2s; }
.slide-outline { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; margin-top: 18px; padding: 16px; border: 1px solid #d7e1ce; border-radius: 10px; background: #fafbf6; }
.slide-outline button { display: flex; align-items: flex-start; gap: 10px; border: 1px solid #e1e8da; border-radius: 6px; padding: 12px 10px; text-align: left; color: #647a58; background: #f6f9ef; font: inherit; font-size: 11px; line-height: 1.7; cursor: pointer; }
.slide-outline button > span { color: #90a180; font-size: 10px; }
.slide-outline button:hover, .slide-outline button[aria-current] { border-color: #9fba8c; color: #375c3b; background: #eaf2e1; }
.presenting { position: fixed; inset: 16px; display: flex; flex-direction: column; margin: 0; z-index: 100; padding: 16px 22px 12px; border: 1px solid #d5dfce; border-radius: 16px; background: #f4f6ee; box-shadow: 0 20px 80px #213d3533; }
.presenting::before { content: ''; position: fixed; z-index: -1; inset: 0; background: #eef1e8; }
.presenting .deck-toolbar { flex-shrink: 0; margin-bottom: 12px; }
.presenting .deck-frame { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.presenting .slide-topline, .presenting .slide-bottomline { flex-shrink: 0; }
.presenting .slide-topline { padding-top: 12px; padding-bottom: 8px; }
.presenting .slide-bottomline { padding-top: 6px; padding-bottom: 6px; }
.presenting .deck-slide { flex: 1; min-height: 0; overflow: auto; padding-top: 14px; padding-bottom: 14px; }
.presenting .slide-copy h2 { font-size: clamp(26px,2.5vw,34px); line-height: 1.22; }
.presenting .slide-lead { margin-top: 14px; margin-bottom: 16px; font-size: 13px; }
.presenting .slide-points { gap: 10px; }
.presenting .slide-points li { line-height: 1.75; }
.presenting .slide-takeaway { margin-top: 18px; padding-top: 11px; padding-bottom: 11px; }
.presenting .slide-visual { padding: 17px 20px; }
.presenting .slide-visual figcaption { margin-bottom: 18px; }
.presenting .visual-note { margin-top: 12px; }
.presenting .deck-controls { flex-shrink: 0; padding-top: 12px; padding-bottom: 8px; }
.presenting .slide-outline { position: absolute; left: 22px; right: 22px; bottom: 74px; max-height: 65%; overflow: auto; box-shadow: 0 15px 30px #31483122; }
@media (min-width: 1500px) { .presenting .deck-slide { padding-right: max(42px,calc((100vw - 1300px)/2)); padding-left: max(42px,calc((100vw - 1300px)/2)); } }
@media (max-width: 1100px) { .deck-slide { gap: 25px; padding-right: 26px; padding-left: 26px; } .slide-visual { padding: 20px; } .keyboard-hint { display: none; } .deck-tools select { max-width: 270px; } }
@media (max-width: 800px) { .deck-slide { grid-template-columns: minmax(0,1fr); } .deck-tools select { max-width: 180px; } .slide-outline { grid-template-columns: repeat(2,minmax(0,1fr)); } .deck-label div > span { display: none; } }
@media (max-width: 600px) { .deck-toolbar { flex-wrap: wrap; } .deck-tools { flex: 1; } .deck-tools select { flex: 1; max-width: 100%; width: 150px; } .slide-topline { padding-right: 18px; padding-left: 18px; font-size: 8px; } .slide-topline > span:first-child { gap: 9px; } .slide-topline b { margin-left: 8px; } .slide-bottomline > span { display: none; } .deck-slide { padding: 20px; } .slide-nav { padding: 9px 11px; font-size: 10px; } .deck-position { gap: 0; } .outline-button { padding: 5px; } .slide-visual { padding: 17px; } .presenting { inset: 8px; padding: 14px; } .rate-card { padding: 16px 12px; } .rate-card strong { font-size: 20px; } .ensemble-branches { gap: 6px; } .ensemble-branch { padding-right: 6px; padding-left: 6px; } }
</style>
