<script setup lang="ts">
import LungViewer from "./LungViewer.vue";
import AppIcon from "./AppIcon.vue";
import { finalScreeningGates, matchedSeedScores } from "../content/researchContent";
defineProps<{ kind: string }>();
const categories = [
  { name: "Normal", count: "1,579", percent: "27.1%", color: "#8fae78" },
  { name: "Viral", count: "1,485", percent: "25.5%", color: "#c4a96b" },
  { name: "Bacterial", count: "2,760", percent: "47.4%", color: "#3b735d" },
];
</script>

<template>
  <div v-if="kind === 'lungs'" class="presentation-anatomy">
    <LungViewer :analyzing="false" />
    <p class="media-caption">Interactive anatomy illustration · drag to rotate, switch layers or preview the scan.</p>
  </div>
  <div v-else-if="kind === 'imagery'" class="radiograph-story">
    <div class="image-label"><span></span> CHEST RADIOGRAPH · EDUCATIONAL EXAMPLE</div>
    <img class="xray-example" src="/research/chest-xray-examples.jpg" alt="Public comparison image labeled Pneumonia on the left and Normal on the right." width="1293" height="500" />
    <div class="image-facts"><div><strong>5,856</strong><span>Before exact deduplication</span></div><span class="image-arrow">→</span><div><strong>5,824</strong><span>Unique study images</span></div></div>
    <p class="media-caption">This public illustration shows the image type; it is not an audited sample or prediction from our study.</p>
    <p class="image-credit">Image: <a href="https://commons.wikimedia.org/wiki/File:Chest_X-ray_images_showing_normal_and_pneumonia.jpg" target="_blank" rel="noopener noreferrer">NahomNati / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · unchanged.</p>
  </div>
  <div v-else-if="kind === 'distribution'" class="distribution-chart">
    <div class="donut-wrap">
      <svg viewBox="0 0 240 240" role="img" aria-label="Class distribution: Normal 1,579 images, Viral 1,485 and Bacterial 2,760, totaling 5,824.">
        <circle class="donut-track" cx="120" cy="120" r="88" />
        <g transform="rotate(-90 120 120)" class="donut-segments">
          <circle cx="120" cy="120" r="88" pathLength="100" stroke="#8fae78" stroke-dasharray="26.61 73.39" />
          <circle cx="120" cy="120" r="88" pathLength="100" stroke="#c4a96b" stroke-dasharray="25 75" stroke-dashoffset="-27.11" />
          <circle cx="120" cy="120" r="88" pathLength="100" stroke="#3b735d" stroke-dasharray="46.89 53.11" stroke-dashoffset="-52.61" />
        </g>
        <text x="120" y="116" class="donut-total">5,824</text><text x="120" y="141" class="donut-subtitle">UNIQUE IMAGES</text>
      </svg>
    </div>
    <div class="distribution-legend"><div v-for="category in categories" :key="category.name"><i :style="{background:category.color}"></i><span>{{category.name}}</span><strong>{{category.count}}</strong><small>{{category.percent}}</small></div></div>
    <p class="media-caption">Bacterial images make up almost half the dataset. Macro F1 gives all three classes equal importance.</p>
  </div>
  <div v-else-if="kind === 'uncertainty'" class="uncertainty-chart">
    <div class="comparison-scores"><div><span>FT-004</span><strong>85.305<span>%</span></strong><small>Three networks</small></div><div><span>FT-010</span><strong>85.029<span>%</span></strong><small>One network</small></div></div>
    <div class="interval-heading"><strong>+0.276 points</strong><span>Observed macro-F1 difference</span></div>
    <svg viewBox="0 0 480 150" role="img" aria-label="FT-004 minus FT-010 macro F1: difference plus 0.276 percentage points; 95 percent interval from minus 0.833 to plus 1.369, crossing zero.">
      <line x1="35" y1="90" x2="445" y2="90" class="chart-axis" />
      <g v-for="(tick,index) in ['−1.5','−1','−0.5','0','+0.5','+1','+1.5']" :key="tick"><line :x1="35+index*68.333" y1="87" :x2="35+index*68.333" y2="95" class="chart-axis"/><text :x="35+index*68.333" y="115" class="axis-tick">{{tick}}</text></g>
      <line x1="240" y1="17" x2="240" y2="90" class="zero-line" />
      <text x="240" y="12" class="zero-label">NO DIFFERENCE</text>
      <g class="interval-mark"><line x1="126.16" y1="58" x2="427.10" y2="58" class="confidence-line" /><line x1="126.16" y1="48" x2="126.16" y2="68" class="confidence-cap"/><line x1="427.10" y1="48" x2="427.10" y2="68" class="confidence-cap"/><circle cx="277.72" cy="58" r="7" class="estimate-dot"/></g>
      <text x="126" y="39" class="interval-label">−0.833</text><text x="424" y="39" class="interval-label">+1.369</text>
      <text x="35" y="141" class="axis-direction" text-anchor="start">Favors FT-010</text><text x="445" y="141" class="axis-direction" text-anchor="end">Favors FT-004</text>
    </svg>
    <p class="media-caption">Three-seed validation means and a 95% paired-bootstrap interval. Independent external performance remains unmeasured.</p>
  </div>
  <div v-else-if="kind === 'decision'" class="final-decision-chart">
    <p class="decision-chart-label">MACRO F1 · SAME SEED, SAME 874 VALIDATION IMAGES</p>
    <div class="matched-score-rows">
      <div v-for="model in matchedSeedScores" :key="model.id" class="matched-score-row" :class="{ 'selected-score': model.selected }">
        <div class="matched-score-heading"><strong>{{ model.id }}</strong><span>{{ model.score.toFixed(3) }}<small>%</small></span></div>
        <div class="matched-score-track" role="meter" :aria-label="`${model.id}: ${model.detail}; seed-42 validation macro F1`" :aria-valuenow="model.score" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: `${model.score}%` }"></span></div>
      </div>
    </div>
    <div class="decision-score-axis" aria-hidden="true"><span>0%</span><span>100%</span></div>
    <div class="screening-summary"><AppIcon name="check" :size="18" /><div><strong>FT-004 retained</strong><span>Only 1 of 5 FT-011 screening checks passed.</span></div></div>
    <div class="screening-outcomes" aria-label="Final FT-011 screening outcomes"><span v-for="gate in finalScreeningGates" :key="gate.label" :class="{ passed: gate.passed }"><b>{{ gate.passed ? '✓' : '×' }}</b>{{ gate.label }}</span></div>
    <p class="media-caption">Seed 42 only. These are validation scores, not three-seed means or external-test performance. Full thresholds are in the linked final report.</p>
  </div>
</template>

<style scoped>
.media-caption,.image-credit {color:#70816b;font-size:10px;line-height:1.7;margin-top:12px;}
.image-credit {font-size:9px;margin-top:8px;}.image-credit a {text-decoration:underline;text-underline-offset:3px;color:#476e50;}
.image-label {display:flex;align-items:center;gap:7px;font-size:8px;letter-spacing:1.2px;color:#819575;margin-bottom:13px;}.image-label>span {width:5px;height:5px;background:#72976a;border-radius:50%;}
.xray-example {display:block;width:100%;height:auto;border:6px solid #fff;border-radius:8px;box-shadow:0 8px 18px #20332612;}
.image-facts {display:flex;align-items:center;justify-content:space-around;gap:15px;margin-top:22px;}.image-facts div {display:grid;gap:5px;}.image-facts strong {font-family:'Manrope',sans-serif;font-size:27px;font-weight:600;color:#426343;}.image-facts div span {font-size:9px;color:#829276;}.image-arrow {font-size:26px;color:#9aaf8a;}
.donut-wrap {width:215px;margin:0 auto;}.donut-wrap svg {display:block;width:100%;}.donut-track,.donut-segments circle {fill:none;stroke-width:25;}.donut-track {stroke:#dbe5d1;}.donut-total {font:600 34px 'Manrope',sans-serif;fill:#365940;text-anchor:middle;letter-spacing:-1px;}.donut-subtitle {font:9px 'DM Sans',sans-serif;fill:#809373;text-anchor:middle;letter-spacing:1.5px;}
.distribution-legend {display:grid;gap:12px;margin-top:10px;}.distribution-legend>div {display:flex;align-items:center;gap:10px;color:#59714f;font-size:11px;}.distribution-legend i {width:8px;height:8px;border-radius:50%;}.distribution-legend strong {margin-left:auto;font-variant-numeric:tabular-nums;font-weight:500;font-size:13px;}.distribution-legend small {width:40px;text-align:right;color:#819574;font-size:10px;}
.comparison-scores {display:grid;grid-template-columns:1fr 1fr;gap:15px;}.comparison-scores>div {padding:18px;background:#fafcf5;border:1px solid #d7e2cf;border-radius:10px;display:grid;gap:8px;}.comparison-scores>div:first-child {background:#e5efdc;border-color:#b7cda4;}.comparison-scores span,.comparison-scores small {font-size:10px;color:#789068;}.comparison-scores strong {font:600 27px 'Manrope',sans-serif;letter-spacing:-1px;color:#3d6540;}.comparison-scores strong span {font-size:14px;}.interval-heading {margin:24px 0 14px;display:grid;gap:5px;}.interval-heading strong {font-size:17px;font-weight:500;color:#416944;}.interval-heading span {font-size:10px;color:#819474;}.uncertainty-chart svg {width:100%;display:block;overflow:visible;}.chart-axis {stroke:#c2d0b6;stroke-width:1;}.zero-line {stroke:#a8b79b;stroke-dasharray:3 4;}.confidence-line {stroke:#739567;stroke-width:5;stroke-linecap:round;}.confidence-cap {stroke:#739567;stroke-width:2;}.estimate-dot {fill:#2c624b;stroke:#f2f7eb;stroke-width:3;}.axis-tick,.zero-label,.interval-label {font:10px 'DM Sans',sans-serif;fill:#7c8f71;text-anchor:middle;}.axis-direction {font:10px 'DM Sans',sans-serif;fill:#7c8f71;}.zero-label {font-size:8px;letter-spacing:1px;}.interval-label {fill:#4c7346;font-size:11px;}
.presentation-anatomy :deep(.anatomy-panel) {min-height:0;height:330px;border-radius:10px;}
.uncertainty-chart .comparison-scores>div {padding:14px;gap:6px;}
.uncertainty-chart .interval-heading {margin:16px 0 10px;}
.uncertainty-chart svg {max-height:145px;}
.decision-chart-label {margin:0 0 18px;color:#7c8f71;font-size:8px;letter-spacing:.9px;line-height:1.7;}
.matched-score-rows {display:grid;gap:16px;}
.matched-score-heading {display:flex;justify-content:space-between;align-items:baseline;gap:12px;color:#5b7055;}
.matched-score-heading>strong {font-size:12px;font-weight:600;}
.matched-score-heading>span {font:600 22px 'Manrope',sans-serif;letter-spacing:-.6px;font-variant-numeric:tabular-nums;}
.matched-score-heading small {font-size:11px;margin-left:2px;}
.matched-score-track {height:10px;margin-top:8px;overflow:hidden;border-radius:4px;background:#dce5d3;}
.matched-score-track>span {display:block;height:100%;background:#a5b891;border-radius:4px;transform-origin:left;animation:decision-bar 650ms cubic-bezier(.2,.7,.2,1) both;}
.selected-score .matched-score-heading {color:#315f42;}
.selected-score .matched-score-track>span {background:#3b735d;}
.matched-score-row:last-child .matched-score-track>span {background:#baa776;}
.decision-score-axis {display:flex;justify-content:space-between;margin-top:7px;color:#8a9a7d;font-size:8px;}
.screening-summary {display:flex;align-items:center;gap:10px;padding:13px 14px;margin-top:18px;background:#e5efdc;border:1px solid #c5d6b8;border-radius:8px;color:#416944;}
.screening-summary>div {display:grid;gap:4px;}
.screening-summary strong {font-size:12px;font-weight:600;}
.screening-summary span {font-size:9px;color:#68825b;}
.screening-outcomes {display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
.screening-outcomes>span {display:inline-flex;align-items:center;gap:5px;padding:5px 7px;border-radius:5px;background:#f1ebde;color:#927844;font-size:8px;}
.screening-outcomes>span.passed {background:#e4edda;color:#53714c;}
.screening-outcomes b {font-size:11px;}
@keyframes decision-bar {from {transform:scaleX(0);} to {transform:scaleX(1);}}
@media (prefers-reduced-motion:reduce) {.matched-score-track>span {animation:none;}}
.presentation-anatomy :deep(.anatomy-top) {margin:15px 18px 0;}.presentation-anatomy :deep(.anatomy-title) {display:none;}.presentation-anatomy :deep(.anatomy-modes) {top:39px;right:15px;}.presentation-anatomy :deep(.anatomy-stage) {min-height:0;margin-top:0;}.presentation-anatomy :deep(.lung-canvas) {inset:0 0 24px;}.presentation-anatomy :deep(.anatomy-label) {display:none;}.presentation-anatomy :deep(.scan-readout) {bottom:0;}.presentation-anatomy :deep(.scan-preview-row) {margin:8px 18px 0;padding-top:7px;}.presentation-anatomy :deep(.viewer-bottom) {height:42px;margin:0 18px;}.presentation-anatomy :deep(.orbital) {width:220px;height:220px;}.presentation-anatomy :deep(.viewer-controls button) {min-width:25px;padding:5px;}.presentation-anatomy :deep(.drag-hint) {font-size:9px;}
</style>
