<script setup lang="ts">
import AnalyzerPanel from "./components/AnalyzerPanel.vue";
import AppIcon from "./components/AppIcon.vue";
import ResearchPage from "./components/ResearchPage.vue";
import ResearchProcessSection from "./components/ResearchProcessSection.vue";

const isResearch = window.location.pathname.replace(/\/+$/, "") === "/research";
document.title = isResearch ? "Pulmo — Research" : "Pulmo — Lung intelligence";
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" :href="isResearch ? '#research-main' : '#workspace'">
      {{ isResearch ? "Skip to research" : "Skip to analyzer" }}
    </a>
    <header class="site-header">
      <a class="brand" href="/#workspace" aria-label="Pulmo home">
        <span class="brand-symbol"
          ><svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M14 8v9l-4 4M18 8v9l4 4M11 11C8 9 3 18 4 24c1 4 9 3 9-1V13M21 11c3-2 8 7 7 13-1 4-9 3-9-1V13"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg
        ></span>
        <span class="wordmark">pulmo<span>.</span></span
        ><span class="brand-divider"></span
        ><span class="brand-descriptor">Lung intelligence</span>
      </a>
      <nav aria-label="Main navigation">
        <a :class="{ 'nav-active': !isResearch }" :aria-current="!isResearch ? 'page' : undefined" href="/#workspace">Workspace</a>
        <a href="/#how-it-works">How it works</a>
        <a :class="{ 'nav-active': isResearch }" :aria-current="isResearch ? 'page' : undefined" href="/research">Research</a>
        <a class="nav-about" href="/#about">About</a>
      </nav>
      <span class="research-tag"><span></span> Research edition</span>
    </header>

    <ResearchPage v-if="isResearch" />
    <main v-else id="workspace" class="main-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">
            <span class="tiny-cross">+</span> A NEW PERSPECTIVE ON LUNG HEALTH
          </p>
          <h1>
            A clearer view.<br class="mobile-break" />
            A more informed next step.
          </h1>
          <p class="page-description">
            Explore the anatomy. Upload a chest X-ray. Review your AI-powered
            analysis.
          </p>
        </div>
        <div class="heading-note">
          <AppIcon name="shield" :size="20" /><span
            >Designed for exploration.<br /><strong
              >Guided by human expertise.</strong
            ></span
          >
        </div>
      </div>

      <AnalyzerPanel />

      <ResearchProcessSection />

      <section
        id="using-demo"
        class="workflow"
        aria-labelledby="workflow-title"
      >
        <div class="section-label">
          <h2 id="workflow-title">Using the interactive demo</h2>
          <span>Three simple steps</span>
        </div>
        <div class="workflow-grid">
          <article>
            <span class="workflow-icon"><AppIcon name="upload" /></span>
            <div>
              <h3><span>01</span> Upload your X-ray</h3>
              <p>Choose a clear chest X-ray in JPEG or PNG format.</p>
            </div>
            <AppIcon class="workflow-arrow" name="chevron" :size="16" />
          </article>
          <article>
            <span class="workflow-icon"><AppIcon name="scan" /></span>
            <div>
              <h3><span>02</span> Let the model analyze</h3>
              <p>FT-004 averages three models’ Normal, Viral and Bacterial scores.</p>
            </div>
            <AppIcon class="workflow-arrow" name="chevron" :size="16" />
          </article>
          <article>
            <span class="workflow-icon"><AppIcon name="file" /></span>
            <div>
              <h3><span>03</span> Review the result</h3>
              <p>Compare all three class scores and review the predicted pattern.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="about" class="about-strip" aria-labelledby="about-title">
        <AppIcon name="info" :size="19" />
        <div>
          <h2 id="about-title">An extra perspective, not a diagnosis.</h2>
          <p>
            Pulmo uses the FT-004 ensemble of three DenseNet201 classifiers for research and
            education. It compares Normal, Viral Pneumonia and Bacterial Pneumonia patterns. Results may be incorrect and should be interpreted by a
            qualified clinician alongside patient history. The 3D lungs are an
            illustration, not a reconstruction of your X-ray.
          </p>
        </div>
        <span class="model-label"
          >FT-004 <span> / </span> 3 × DENSENET201</span
        >
      </section>
    </main>
    <footer class="site-footer">
      <a class="footer-brand" href="/#workspace">pulmo.</a
      ><span>A little more insight. A little more clarity.</span
      ><a class="footer-research" href="/research">Research & sources</a>
      <span>For research & education</span>
    </footer>
  </div>
</template>
