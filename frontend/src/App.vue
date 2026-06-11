<template>
  <div class="app-shell">
    <Toast position="top-right" />
    <AppHeader :sections="sections" />

    <main>
      <section id="analyze" class="section hero-section" aria-labelledby="hero-title">
        <div class="hero-media" aria-hidden="true">
          <img src="/lungs.png" alt="" class="lung-visual" />
        </div>

        <div class="hero-copy">
          <p class="eyebrow">Chest X-ray decision support</p>
          <h1 id="hero-title">AI Lung Analyzer</h1>
          <p class="hero-lede">
            Upload a JPEG or PNG chest X-ray and get a quick pneumonia screening prediction from the trained DenseNet model.
          </p>

          <div class="hero-actions">
            <a class="primary-link" href="#analyzer">Start analysis</a>
            <a class="secondary-link" href="#facts">Review facts</a>
          </div>

          <div class="mini-stats" aria-label="Application highlights">
            <StatPill value="224px" label="model image size" />
            <StatPill value="CLAHE" label="contrast preprocessing" />
            <StatPill value="FastAPI" label="local inference API" />
          </div>
        </div>

        <AnalyzerPanel id="analyzer" />
      </section>

      <FactsSection />
      <WorkflowSection />
      <SafetySection />
    </main>

    <footer class="site-footer">
      <span>AI Lung Analyzer by Gerald</span>
      <span>For research and educational use only. Not a medical diagnosis.</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
import AnalyzerPanel from "./components/AnalyzerPanel.vue";
import FactsSection from "./components/FactsSection.vue";
import SafetySection from "./components/SafetySection.vue";
import StatPill from "./components/StatPill.vue";
import WorkflowSection from "./components/WorkflowSection.vue";

const sections = [
  { label: "Analyze", href: "#analyze" },
  { label: "Facts", href: "#facts" },
  { label: "Workflow", href: "#workflow" },
  { label: "Safety", href: "#safety" },
];
</script>
