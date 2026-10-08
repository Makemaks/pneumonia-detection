<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import { breathingFrame } from "../lib/breathing";

const props = defineProps<{ analyzing: boolean }>();
const host = ref<HTMLDivElement | null>(null);
const ready = ref(false);
const frontView = ref(true);
const unavailable = ref(false);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motion = ref(!reducedMotion.matches);
const wireframe = ref(false);
const airwayView = ref(true);
const breathPhase = ref("inhale");
const breathVolume = ref(0);
const breathLabel = computed(() =>
  !motion.value
    ? "Breathing paused"
    : breathPhase.value === "inhale"
      ? "Inhaling · lungs expanding"
      : breathPhase.value === "exhale"
        ? "Exhaling · lungs relaxing"
        : "Between breaths",
);
const preview = ref(false);
const scanning = computed(() => props.analyzing || preview.value);
const scanLabel = computed(() =>
  props.analyzing
    ? "Analyzing X-ray"
    : preview.value
      ? "Scan preview"
      : breathLabel.value,
);
let resetView = () => {};
let rotateView = (_direction: number) => {};
let zoomView = (_factor: number) => {};
let cleanup = () => {};
let disposed = false;
let previewTimer: ReturnType<typeof setTimeout> | undefined;
function stopPreview() {
  preview.value = false;
  clearTimeout(previewTimer);
}
function previewScan() {
  if (preview.value) {
    stopPreview();
    return;
  }
  preview.value = true;
  previewTimer = setTimeout(stopPreview, 5200);
}
watch(
  () => props.analyzing,
  () => stopPreview(),
);

onMounted(async () => {
  let cleanResources = () => {};
  try {
    const [T, { OrbitControls }, { createLungModel }] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("../lib/lungModel"),
    ]);
    if (disposed || !host.value) return;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(36, 1, 0.1, 60);
    const renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    cleanResources = () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.value.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 5.5;
    controls.maxDistance = 9;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.7;
    resetView = () => {
      camera.position.set(0.45, 0.48, 6.4);
      controls.target.set(0, 0.12, 0);
      controls.update();
    };
    resetView();
    rotateView = (direction) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new T.Vector3(0, 1, 0), direction * 0.18);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    zoomView = (factor) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(
        T.MathUtils.clamp(
          offset.length() * factor,
          controls.minDistance,
          controls.maxDistance,
        ),
      );
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    scene.add(new T.HemisphereLight(0xe1e8e4, 0x292020, 1.8));
    const key = new T.DirectionalLight(0xffe3cf, 3.2);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const fill = new T.DirectionalLight(0xa6d3d8, 1.4);
    fill.position.set(4, 1, 3);
    scene.add(fill);
    const rim = new T.DirectionalLight(0xf4b6a9, 2.6);
    rim.position.set(1, 3, -4);
    scene.add(rim);
    const model = createLungModel();
    scene.add(model.group);
    cleanResources = () => {
      renderer.setAnimationLoop(null);
      controls.dispose();
      model.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    const resize = new ResizeObserver(() => {
      if (!host.value) return;
      const { width, height } = host.value.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(host.value);
    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
    });
    intersection.observe(host.value);
    const onMotionChange = () => {
      motion.value = !reducedMotion.matches;
    };
    reducedMotion.addEventListener("change", onMotionChange);
    const onContextLoss = (event: Event) => {
      event.preventDefault();
      unavailable.value = true;
      renderer.setAnimationLoop(null);
      stopPreview();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLoss);
    let animationTime = 0,
      scanTime = 0,
      previous = 0,
      scanAmount = 0;
    const stopScanWatch = watch(scanning, () => {
      scanTime = 0;
    });
    renderer.setAnimationLoop((time) => {
      if (!visible || document.hidden) {
        previous = time;
        return;
      }
      if (time - previous < 32) return;
      const delta = Math.min((time - previous) / 1000, 0.06);
      previous = time;
      controls.update();
      frontView.value = Math.abs(controls.getAzimuthalAngle()) < 0.38;
      if (motion.value) {
        animationTime += delta;
        if (scanning.value) scanTime += delta;
      }
      // The visual sweep is deliberately independent of inference progress.
      const phase = (scanTime % 4.8) / 4.8;
      const sweep = T.MathUtils.smoothstep(phase, 0.035, 0.965);
      const height = motion.value || scanTime > 0 ? 1.78 - sweep * 3.28 : 0.12;
      const target = scanning.value ? 1 : 0;
      scanAmount = reducedMotion.matches
        ? target
        : T.MathUtils.damp(scanAmount, target, scanning.value ? 9 : 15, delta);
      const breathing = breathingFrame(animationTime);
      breathPhase.value = breathing.phase;
      breathVolume.value = breathing.volume;
      model.update(
        breathing,
        scanAmount,
        height,
        airwayView.value,
        wireframe.value,
      );
      renderer.render(scene, camera);
      ready.value = true;
    });
    cleanup = () => {
      stopScanWatch();
      resize.disconnect();
      intersection.disconnect();
      reducedMotion.removeEventListener("change", onMotionChange);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLoss,
      );
      cleanResources();
    };
  } catch {
    cleanResources();
    unavailable.value = true;
  }
});
onBeforeUnmount(() => {
  disposed = true;
  stopPreview();
  cleanup();
});
</script>

<template>
  <section
    class="anatomy-panel realistic-lungs"
    :class="{ 'is-scanning': scanning, 'motion-paused': !motion }"
    aria-labelledby="anatomy-title"
  >
    <div class="anatomy-top">
      <span class="viewer-tag"><span></span> INTERACTIVE ANATOMY</span
      ><span class="viewer-index">01 / LUNGS</span>
    </div>
    <div class="anatomy-title">
      <h2 id="anatomy-title">Every breath,<br /><em>a closer look.</em></h2>
      <p>Explore the lungs, layer by layer.</p>
    </div>
    <div
      v-if="ready && !unavailable"
      class="anatomy-modes"
      role="group"
      aria-label="Lung display"
    >
      <button
        type="button"
        :aria-pressed="!airwayView"
        @click="airwayView = false"
      >
        Surface
      </button>
      <button
        type="button"
        :aria-pressed="airwayView"
        @click="airwayView = true"
      >
        Airways
      </button>
    </div>
    <div class="anatomy-stage">
      <div class="orbital orbital-one"></div>
      <div class="orbital orbital-two"></div>
      <div
        ref="host"
        class="lung-canvas"
        role="img"
        tabindex="0"
        @keydown.left.prevent="rotateView(-1)"
        @keydown.right.prevent="rotateView(1)"
        @keydown.home.prevent="resetView()"
        aria-label="Illustrative 3D lungs with moving airflow and synchronized breathing. Drag or use left and right arrow keys to rotate. Press Home to reset. Zoom controls are below."
      ></div>
      <div v-if="unavailable" class="viewer-fallback">
        <img src="/lungs.png" alt="Illustration of the lungs" /><span
          >3D is unavailable in this browser. Showing an illustration.</span
        >
      </div>
      <span v-else-if="!ready" class="viewer-loading"
        ><span class="spinner"></span> Preparing 3D anatomy</span
      >
      <template v-if="ready && !unavailable && frontView"
        ><span class="anatomy-label label-right"
          ><span>RIGHT LUNG<small>3 lobes</small></span
          ><i></i></span
        ><span class="anatomy-label label-left"
          ><i></i><span>LEFT LUNG<small>2 lobes</small></span></span
        ></template
      >
      <div
        v-if="ready && !unavailable"
        class="scan-readout"
        :class="{ active: scanning }"
      >
        <span class="scan-indicator" aria-hidden="true"
          ><svg viewBox="0 0 54 18">
            <path d="M0 9h13l4-4 4 9 5-13 5 16 4-8h19" /></svg
        ></span>
        <span
          >{{ scanLabel
          }}<small>{{
            scanning
              ? "Illustrative scan · not a diagnostic heatmap"
              : "Illustrative airflow · not a patient measurement"
          }}</small></span
        >
      </div>
    </div>
    <span class="visually-hidden" role="status">{{
      scanning
        ? props.analyzing
          ? "Analyzing X-ray. Illustrative scanning animation active."
          : "Scan preview active."
        : "Breathing illustration."
    }}</span>
    <div class="scan-preview-row" v-if="ready && !unavailable">
      <span class="breath-legend"
        ><i :class="breathPhase"></i
        >{{
          motion
            ? breathPhase === "inhale"
              ? "Air in"
              : breathPhase === "exhale"
                ? "Air out"
                : "Rest"
            : "Paused"
        }}<span class="breath-volume" aria-hidden="true"
          ><span
            :style="{ transform: `scaleX(${breathVolume})` }"
          ></span></span></span
      ><button
        type="button"
        :disabled="analyzing"
        :aria-pressed="preview"
        @click="previewScan"
      >
        <AppIcon :name="preview ? 'close' : 'scan'" :size="14" />{{
          analyzing
            ? "Scan in progress"
            : preview
              ? "Stop preview"
              : "Preview scan"
        }}
      </button>
    </div>
    <div class="viewer-bottom">
      <span class="drag-hint"
        ><AppIcon name="rotate" :size="15" />{{
          unavailable ? "Anatomy illustration" : "Drag to rotate"
        }}</span
      >
      <div
        v-if="!unavailable"
        class="viewer-controls"
        aria-label="3D viewer controls"
      >
        <button
          type="button"
          :aria-label="motion ? 'Pause lung animation' : 'Play lung animation'"
          :aria-pressed="motion"
          @click="motion = !motion"
        >
          <AppIcon :name="motion ? 'pause' : 'play'" :size="15" />
        </button>
        <button
          type="button"
          aria-label="Toggle wireframe view"
          :aria-pressed="wireframe"
          @click="wireframe = !wireframe"
        >
          <AppIcon name="layers" :size="16" /></button
        ><span></span>
        <button type="button" aria-label="Zoom out" @click="zoomView(1.12)">
          <AppIcon name="minus" :size="16" />
        </button>
        <button type="button" aria-label="Zoom in" @click="zoomView(0.88)">
          <AppIcon name="plus" :size="16" />
        </button>
        <button type="button" aria-label="Reset lung view" @click="resetView()">
          <AppIcon name="rotate" :size="15" />
        </button>
      </div>
    </div>
  </section>
</template>
