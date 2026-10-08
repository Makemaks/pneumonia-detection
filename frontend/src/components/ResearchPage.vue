<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "./AppIcon.vue";
import ResearchPresentation from "./ResearchPresentation.vue";
import {
  demoBoundary,
  researchDocuments,
  researchIntro,
  researchModels,
  researchSources,
  researchSteps,
} from "../content/researchContent";

const trainingModel = computed(() =>
  researchModels.find((model) => /training|in progress/i.test(model.status)),
);

function sourceLabel(id: number) {
  const source = researchSources.find((item) => item.id === id);
  return source ? `Reference ${id}: ${source.title}` : `Reference ${id}`;
}

function modelStatusClass(status: string) {
  if (/training|pending|in progress/i.test(status)) return "model-pending";
  if (/selected|incumbent|frozen/i.test(status)) return "model-selected";
  return "model-alternative";
}
</script>

<template>
  <main id="research-main" class="research-page" tabindex="-1">
    <a class="back-link" href="/#workspace">
      <AppIcon class="back-arrow" name="arrow" :size="16" /> Back to Workspace
    </a>

    <header class="research-hero">
      <div class="research-heading">
        <p class="research-eyebrow">THE PROCESS, THE MODELS, THE EVIDENCE</p>
        <h1>The research behind Pulmo</h1>
        <p class="research-intro">Follow the full study in a step-by-step presentation, from the public X-rays to our final tuning decision. Open Present for a focused view, or choose any slide to explore a specific question.</p>
        <nav class="page-links" aria-label="Research page sections">
          <a href="#research-presentation">Presentation</a>
          <a href="#research-models">Models</a>
          <a href="#research-documents">Documents</a>
          <a href="#research-references">References</a>
        </nav>
      </div>

    </header>

    <ResearchPresentation />

    <section class="demo-note" aria-labelledby="demo-note-title">
      <span class="demo-note-icon"><AppIcon name="info" :size="20" /></span>
      <div>
        <h2 id="demo-note-title">About this demo</h2>
        <p>{{ demoBoundary }}</p>
      </div>
    </section>

    <details class="written-method">
      <summary>Read the complete written method <AppIcon name="file" :size="17" /></summary>
      <p class="written-intro">{{ researchIntro }}</p>
      <section
      id="research-methods"
      class="research-block"
      aria-labelledby="research-methods-title"
    >
      <div class="block-heading">
        <div>
          <p class="research-eyebrow">THE PROCESS</p>
          <h2 id="research-methods-title">How we study the model</h2>
        </div>
        <span class="section-icon"><AppIcon name="scan" :size="21" /></span>
      </div>

      <ol class="method-steps">
        <li v-for="step in researchSteps" :key="step.number" class="method-step">
          <span class="method-number" aria-hidden="true">{{ step.number }}</span>
          <div class="method-copy">
            <h3>{{ step.title }}</h3>
            <p class="method-body">{{ step.body }}</p>
            <p v-if="step.detail" class="method-detail">{{ step.detail }}</p>
            <div v-if="step.sourceIds.length" class="method-sources">
              <span>References</span>
              <a
                v-for="sourceId in step.sourceIds"
                :key="sourceId"
                :href="`#research-source-${sourceId}`"
                :aria-label="sourceLabel(sourceId)"
                >[{{ sourceId }}]</a
              >
            </div>
          </div>
        </li>
      </ol>
      </section>
    </details>

    <section
      id="research-models"
      class="research-block"
      aria-labelledby="research-models-title"
    >
      <div class="block-heading">
        <div>
          <p class="research-eyebrow">MODEL COMPARISON</p>
          <h2 id="research-models-title">The models and their results</h2>
        </div>
        <div v-if="trainingModel" class="training-status">
          <AppIcon name="clock" :size="16" />
          <span>{{ trainingModel.id }} · {{ trainingModel.status }}</span>
        </div>
      </div>

      <div class="model-grid">
        <article
          v-for="model in researchModels"
          :key="model.id"
          class="model-card"
          :class="modelStatusClass(model.status)"
          :aria-labelledby="`research-model-${model.id}`"
        >
          <div class="model-topline">
            <span class="model-id">{{ model.id }}</span>
            <span class="model-status">{{ model.status }}</span>
          </div>
          <h3 :id="`research-model-${model.id}`">{{ model.title }}</h3>
          <p class="model-description">{{ model.description }}</p>
          <dl class="model-facts">
            <div>
              <dt>Model setup</dt>
              <dd>{{ model.networks }}</dd>
            </div>
            <div class="model-score">
              <dt>Validation macro F1</dt>
              <dd>{{ model.f1 }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <section
      id="research-documents"
      class="research-block"
      aria-labelledby="research-documents-title"
    >
      <div class="block-heading">
        <div>
          <p class="research-eyebrow">EXPERIMENT RECORDS</p>
          <h2 id="research-documents-title">Read the research and experiment records</h2>
        </div>
        <span class="section-icon"><AppIcon name="file" :size="21" /></span>
      </div>

      <div class="document-grid">
        <a
          v-for="document in researchDocuments"
          :key="document.url"
          class="document-card"
          :href="document.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Open ${document.title} (opens in a new tab)`"
        >
          <div class="document-topline">
            <span class="document-icon"><AppIcon name="file" :size="21" /></span>
            <span class="document-status">{{ document.status }}</span>
          </div>
          <h3>{{ document.title }}</h3>
          <p>{{ document.description }}</p>
          <span class="document-action">
            Open document <AppIcon name="external" :size="15" />
          </span>
        </a>
      </div>
    </section>

    <section
      id="research-references"
      class="research-block"
      aria-labelledby="research-references-title"
    >
      <div class="block-heading">
        <div>
          <p class="research-eyebrow">REFERENCES</p>
          <h2 id="research-references-title">The evidence behind the decisions</h2>
        </div>
        <span class="section-icon"><AppIcon name="layers" :size="21" /></span>
      </div>

      <ol class="reference-list">
        <li
          v-for="source in researchSources"
          :id="`research-source-${source.id}`"
          :key="source.id"
          :value="source.id"
          class="reference-item"
          tabindex="-1"
        >
          <span class="reference-number" aria-hidden="true">{{ source.id }}</span>
          <div class="reference-copy">
            <h3>
              <a :href="source.url" target="_blank" rel="noopener noreferrer">
                {{ source.title }}
                <AppIcon name="external" :size="14" />
                <span class="visually-hidden"> (opens in a new tab)</span>
              </a>
            </h3>
            <p class="reference-meta">{{ source.authors }} · {{ source.year }}</p>
            <p class="reference-takeaway">{{ source.takeaway }}</p>
          </div>
        </li>
      </ol>
    </section>

    <div class="research-endnote">
      <span class="endnote-symbol"><AppIcon name="scan" :size="21" /></span>
      <a class="workspace-link" href="/#workspace">
        Explore the Workspace <AppIcon name="arrow" :size="17" />
      </a>
      <a class="top-link" href="#research-main">Back to top</a>
    </div>
  </main>
</template>

<style scoped>
.research-page {
  max-width: 1320px;
  margin: auto;
  padding: 35px 0 30px;
  outline: none;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 35px;
  margin-bottom: 21px;
  color: #647b62;
  font-size: 12px;
}

.back-arrow {
  transform: rotate(180deg);
}

.back-link:hover,
.workspace-link:hover,
.top-link:hover {
  color: var(--green);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.research-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 0;
}

.research-heading {
  padding-top: 8px;
}

.research-eyebrow {
  color: #65856e;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 1.65px;
  line-height: 1.7;
}

.research-heading h1 {
  max-width: 630px;
  margin: 12px 0 18px;
  color: #263e31;
  font-size: clamp(32px, 3.25vw, 43px);
  font-weight: 550;
  letter-spacing: -1.6px;
  line-height: 1.26;
}

.research-intro {
  max-width: 850px;
  color: #5e7058;
  font-size: 14px;
  line-height: 1.9;
}

.page-links {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  margin-top: 23px;
}

.page-links a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid #dfe6d8;
  border-radius: 6px;
  color: #617857;
  background: #fafbf7;
  font-size: 11px;
}

.page-links a:hover {
  border-color: #b8cbb1;
  background: #edf3e7;
}

.study-summary {
  padding: 25px;
  border: 1px solid #dce5d7;
  border-radius: 13px;
  background: #edf2e9;
}

.summary-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
  color: #5e7e57;
}

.summary-heading h2 {
  color: #3b5b3c;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.15px;
}

.study-summary > p {
  color: #5e7056;
  font-size: 12px;
  line-height: 1.85;
}

.study-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 21px;
  margin: 20px 0 0;
  padding-top: 20px;
  border-top: 1px solid #d6e0cd;
}

.study-stats > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.study-stats dt {
  order: 1;
  color: #687c5d;
  font-size: 11px;
  line-height: 1.6;
}

.study-stats dd {
  margin: 0;
  color: #335e40;
  font-family: "Manrope", "DM Sans", sans-serif;
  font-size: 25px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.8px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.demo-note {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-top: 32px;
  padding: 20px 23px;
  border: 1px solid #e2e6d8;
  border-radius: 10px;
  background: #f9faf4;
}

.demo-note-icon {
  padding-top: 2px;
  color: #78916d;
}

.demo-note h2 {
  margin-bottom: 5px;
  color: #536e49;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 600;
}

.demo-note p {
  max-width: 1070px;
  color: #61745a;
  font-size: 12px;
  line-height: 1.8;
}

.research-block {
  margin-top: 48px;
  scroll-margin-top: 28px;
}

.written-method {
  margin-top: 25px;
  padding: 18px 22px;
  border: 1px solid #e0e6da;
  border-radius: 10px;
  background: #fafbf7;
}
.written-method summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #53744a;
  font-size: 13px;
  cursor: pointer;
}
.written-method summary:focus-visible {
  outline: 2px solid #74a58d;
  outline-offset: 6px;
}
.written-method[open] summary {
  padding-bottom: 18px;
  border-bottom: 1px solid #e5eade;
}
.written-intro {
  max-width: 950px;
  margin-top: 20px;
  color: #64765b;
  font-size: 13px;
  line-height: 1.85;
}
.written-method .research-block {
  margin-top: 25px;
}

.block-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-bottom: 20px;
}

.block-heading h2 {
  margin-top: 7px;
  color: #2f4935;
  font-size: clamp(21px, 2vw, 27px);
  font-weight: 550;
  letter-spacing: -0.65px;
  line-height: 1.4;
}

.section-icon {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  border: 1px solid #e0e7d9;
  border-radius: 10px;
  color: #829674;
  background: #eef2e8;
}

.method-steps {
  list-style: none;
  margin: 0;
  padding: 0 27px;
  border: 1px solid #e0e6da;
  border-radius: 12px;
  background: #fafbf7;
}

.method-step {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 21px;
  padding: 25px 0;
}

.method-step + .method-step {
  border-top: 1px solid #e5eade;
}

.method-number {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin-top: 1px;
  border: 1px solid #d9e4d0;
  border-radius: 50%;
  color: #66845a;
  background: #eef4e6;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.method-copy {
  min-width: 0;
  max-width: 1080px;
}

.method-copy h3 {
  margin-bottom: 8px;
  color: #304c36;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.5;
}

.method-body,
.method-detail {
  color: #5c7055;
  font-size: 13px;
  line-height: 1.85;
}

.method-detail {
  margin-top: 7px;
  color: #6a7c61;
  font-size: 12px;
}

.method-sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  margin-top: 9px;
  color: #74876a;
  font-size: 10px;
}

.method-sources > span {
  margin-right: 6px;
}

.method-sources a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  border-radius: 5px;
  color: #47754d;
  font-size: 11px;
}

.method-sources a:hover {
  background: #eaf1e4;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.training-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid #e8deca;
  border-radius: 7px;
  color: #80683f;
  background: #faf5e9;
  font-size: 11px;
  line-height: 1.6;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}

.model-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 23px;
  border: 1px solid #e0e6da;
  border-radius: 12px;
  background: #fafbf7;
}

.model-selected {
  border-color: #c9d9bf;
  background: #f1f6eb;
}

.model-pending {
  border-color: #e6dfcf;
  background: #fcfaf4;
}

.model-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
  margin-bottom: 17px;
}

.model-id {
  color: #6b8260;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
}

.model-status {
  max-width: 100%;
  padding: 4px 7px;
  border: 1px solid #dde6d5;
  border-radius: 5px;
  color: #5d7850;
  background: #edf3e7;
  font-size: 10px;
  line-height: 1.6;
}

.model-pending .model-status {
  border-color: #ecdfc8;
  color: #8b6f43;
  background: #f8efdc;
}

.model-card h3 {
  margin-bottom: 10px;
  color: #304b36;
  font-size: 18px;
  font-weight: 550;
  letter-spacing: -0.45px;
  line-height: 1.45;
}

.model-description {
  margin-bottom: 23px;
  color: #61735a;
  font-size: 12px;
  line-height: 1.85;
}

.model-facts {
  display: grid;
  gap: 14px;
  margin: auto 0 0;
  padding-top: 17px;
  border-top: 1px solid #dde6d5;
}

.model-facts dt {
  margin-bottom: 5px;
  color: #76886b;
  font-size: 10px;
  line-height: 1.6;
}

.model-facts dd {
  margin: 0;
  color: #3b5d3f;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.model-score dd {
  font-family: "Manrope", "DM Sans", sans-serif;
  font-size: 19px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  line-height: 1.55;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.document-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 24px;
  border: 1px solid #dde5d7;
  border-radius: 12px;
  background: #fafbf7;
}

.document-card:hover {
  border-color: #bdcdb3;
  background: #f1f6eb;
}

.document-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  width: 100%;
  margin-bottom: 19px;
}

.document-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid #dce7d2;
  border-radius: 10px;
  color: #718b63;
  background: #eef4e7;
}

.document-status {
  color: #748969;
  font-size: 10px;
  line-height: 1.6;
  text-align: right;
}

.document-card h3 {
  margin-bottom: 9px;
  color: #36533c;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.document-card > p {
  margin-bottom: 18px;
  color: #66795d;
  font-size: 12px;
  line-height: 1.85;
}

.document-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  color: #487646;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.8;
}

.reference-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid #dfe5d8;
}

.reference-item {
  display: grid;
  grid-template-columns: 33px minmax(0, 1fr);
  align-items: start;
  gap: 17px;
  padding: 23px 0;
  border-bottom: 1px solid #dfe5d8;
  scroll-margin-top: 30px;
}

.reference-item:target {
  border-radius: 7px;
  background: #eaf1e3;
  box-shadow: 0 0 0 10px #eaf1e3;
}

.reference-number {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-top: 1px;
  border: 1px solid #d7e2ce;
  border-radius: 6px;
  color: #647e59;
  background: #eff3e9;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.reference-copy {
  min-width: 0;
}

.reference-copy h3 {
  color: #38593f;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.7;
}

.reference-copy h3 a {
  overflow-wrap: anywhere;
}

.reference-copy h3 a > svg {
  display: inline-block;
  margin-left: 4px;
  vertical-align: -2px;
  color: #829576;
}

.reference-copy h3 a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.reference-meta {
  margin-top: 4px;
  color: #79886f;
  font-size: 11px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.reference-takeaway {
  max-width: 1120px;
  margin-top: 8px;
  color: #5f7157;
  font-size: 12px;
  line-height: 1.85;
}

.research-endnote {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 25px;
  padding: 17px 0;
}

.endnote-symbol {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid #dfe7d7;
  border-radius: 10px;
  color: #7d9470;
  background: #edf2e7;
}

.workspace-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  color: #416d46;
  font-size: 12px;
  font-weight: 600;
}

.top-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  margin-left: auto;
  color: #75876a;
  font-size: 11px;
}

@media (max-width: 1400px) {
  .research-page {
    margin-right: 40px;
    margin-left: 40px;
  }
}

@media (max-width: 1100px) {
  .research-page {
    margin-right: 28px;
    margin-left: 28px;
  }

  .research-hero {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: 30px;
  }

  .model-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .study-summary {
    padding: 22px;
  }
}

@media (max-width: 800px) {
  .research-page {
    padding-top: 24px;
  }

  .research-hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 25px;
  }

  .research-heading {
    padding-top: 0;
  }

  .research-heading h1 {
    max-width: 640px;
    font-size: 36px;
  }

  .study-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 17px;
  }

  .block-heading {
    align-items: flex-start;
  }

  .training-status {
    max-width: 230px;
  }

  .document-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .research-block {
    margin-top: 36px;
  }

  .model-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .block-heading:has(.training-status) {
    flex-direction: column;
    gap: 13px;
  }

  .training-status {
    max-width: 100%;
  }

  .study-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .method-steps {
    padding: 0 20px;
  }

  .method-step {
    grid-template-columns: 31px minmax(0, 1fr);
    gap: 14px;
    padding: 21px 0;
  }

  .method-number {
    width: 28px;
    height: 28px;
  }

  .method-copy h3 {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .research-page {
    margin-right: 18px;
    margin-left: 18px;
    padding-top: 20px;
  }

  .back-link {
    margin-bottom: 19px;
    font-size: 11px;
  }

  .research-eyebrow {
    font-size: 8px;
    letter-spacing: 1.3px;
  }

  .research-heading h1 {
    margin-top: 11px;
    font-size: 30px;
    letter-spacing: -1.2px;
    line-height: 1.3;
  }

  .research-intro {
    font-size: 13px;
  }

  .page-links {
    gap: 7px;
    margin-top: 20px;
  }

  .page-links a {
    min-height: 38px;
    padding-right: 10px;
    padding-left: 10px;
    font-size: 10px;
  }

  .study-summary {
    padding: 20px;
  }

  .study-stats dd {
    font-size: 23px;
  }

  .demo-note {
    gap: 11px;
    margin-top: 23px;
    padding: 17px;
  }

  .demo-note p {
    font-size: 11px;
  }

  .block-heading h2 {
    font-size: 23px;
  }

  .section-icon {
    width: 34px;
    height: 34px;
  }

  .method-steps {
    padding-right: 16px;
    padding-left: 16px;
  }

  .method-step {
    gap: 11px;
  }

  .method-body,
  .method-detail {
    font-size: 12px;
  }

  .model-card,
  .document-card {
    padding: 20px;
  }

  .reference-item {
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 13px;
    padding: 20px 0;
  }

  .reference-copy h3 {
    font-size: 13px;
  }

  .reference-meta {
    font-size: 10px;
  }

  .research-endnote {
    flex-wrap: wrap;
    gap: 10px;
  }

  .workspace-link {
    font-size: 11px;
  }

  .top-link {
    width: 100%;
    margin-left: 48px;
  }
}
</style>
