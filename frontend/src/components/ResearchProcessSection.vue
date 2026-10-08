<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import {
  datasetSummary,
  researchSources,
  researchStats,
  researchSteps,
} from "../content/researchContent";

const stepIcons = ["image", "scan", "layers", "check", "clock", "shield"];

function sourceLabel(id: number) {
  const source = researchSources.find((item) => item.id === id);
  return source ? `Reference ${id}: ${source.title}` : `Reference ${id}`;
}
</script>

<template>
  <section
    id="how-it-works"
    class="research-process"
    aria-labelledby="research-process-title"
  >
    <div class="process-heading">
      <div>
        <p class="process-eyebrow">HOW IT WORKS</p>
        <h2 id="research-process-title">From images to evidence.</h2>
      </div>
      <a class="research-link" href="/research">
        Read the research <AppIcon name="arrow" :size="17" />
      </a>
    </div>

    <div class="dataset-summary">
      <div class="dataset-copy">
        <span class="dataset-icon"><AppIcon name="layers" :size="21" /></span>
        <p>{{ datasetSummary }}</p>
      </div>
      <dl class="process-stats" aria-label="Study at a glance">
        <div v-for="stat in researchStats" :key="stat.label">
          <dt>{{ stat.label }}</dt>
          <dd>{{ stat.value }}</dd>
        </div>
      </dl>
    </div>

    <ol class="process-steps">
      <li v-for="(step, index) in researchSteps" :key="step.number">
        <article class="process-card" :aria-labelledby="`process-step-${step.number}`">
          <div class="step-topline">
            <span class="step-number" aria-hidden="true">{{ step.number }}</span>
            <AppIcon :name="stepIcons[index] || 'file'" :size="20" />
          </div>
          <h3 :id="`process-step-${step.number}`">{{ step.title }}</h3>
          <p class="step-body">{{ step.body }}</p>
          <details v-if="step.detail" class="step-detail">
            <summary>More about this step</summary>
            <p>{{ step.detail }}</p>
          </details>
          <div v-if="step.sourceIds.length" class="step-sources">
            <span>Sources</span>
            <a
              v-for="sourceId in step.sourceIds"
              :key="sourceId"
              :href="`/research#research-source-${sourceId}`"
              :aria-label="sourceLabel(sourceId)"
              >[{{ sourceId }}]</a
            >
          </div>
        </article>
      </li>
    </ol>

    <div class="process-footer">
      <span>Explore the model comparisons, experiment notes and references.</span>
      <a class="research-link" href="/research">
        See the full process <AppIcon name="arrow" :size="17" />
      </a>
    </div>
  </section>
</template>

<style scoped>
.research-process {
  margin-top: 38px;
  scroll-margin-top: 28px;
}

.process-heading,
.process-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.process-heading {
  margin-bottom: 21px;
}

.process-eyebrow {
  margin-bottom: 7px;
  color: #607b68;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 1.55px;
}

.process-heading h2 {
  color: var(--ink);
  font-size: clamp(20px, 1.8vw, 25px);
  font-weight: 550;
  letter-spacing: -0.65px;
  line-height: 1.4;
}

.research-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 40px;
  color: var(--green);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.research-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.dataset-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  align-items: center;
  gap: 30px;
  padding: 22px 25px;
  border: 1px solid #dde5d8;
  border-radius: 11px;
  background: #edf2e9;
}

.dataset-copy {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}

.dataset-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 39px;
  height: 39px;
  border: 1px solid #d7e2d1;
  border-radius: 10px;
  color: #65845e;
  background: #f7f9f3;
}

.dataset-copy p {
  color: #566a54;
  font-size: 12px;
  line-height: 1.8;
}

.process-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 22px;
  margin: 0;
  padding-left: 28px;
  border-left: 1px solid #d8e2d1;
}

.process-stats > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.process-stats dt {
  order: 1;
  color: #66775f;
  font-size: 10px;
  line-height: 1.6;
}

.process-stats dd {
  margin: 0;
  color: #355a43;
  font-family: "Manrope", "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.45px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
  list-style: none;
  margin: 17px 0 0;
  padding: 0;
}

.process-steps > li {
  display: flex;
  min-width: 0;
}

.process-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 22px 23px 17px;
  border: 1px solid #e0e6da;
  border-radius: 11px;
  background: #fafbf7;
}

.step-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 17px;
  color: #7b9271;
}

.step-number {
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  border: 1px solid #dce5d6;
  border-radius: 50%;
  background: #eff4e9;
  color: #5b7953;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.process-card h3 {
  margin-bottom: 8px;
  color: #304b37;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.25px;
  line-height: 1.55;
}

.step-body,
.step-detail p {
  color: #61715b;
  font-size: 12px;
  line-height: 1.8;
}

.step-detail {
  width: 100%;
  margin-top: 11px;
}

.step-detail summary {
  width: fit-content;
  padding: 5px 0;
  color: #54754d;
  font-size: 11px;
  line-height: 1.6;
  cursor: pointer;
}

.step-detail summary:hover {
  color: var(--green);
}

.step-detail summary:focus-visible {
  border-radius: 3px;
  outline: 3px solid #74a58d;
  outline-offset: 4px;
}

.step-detail p {
  margin: 8px 0 5px;
}

.step-sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  margin-top: auto;
  padding-top: 13px;
  color: #708168;
  font-size: 10px;
}

.step-sources > span {
  margin-right: 5px;
}

.step-sources a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  border-radius: 5px;
  color: #42734e;
  font-size: 11px;
}

.step-sources a:hover {
  background: #eaf1e4;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.process-footer {
  margin-top: 15px;
  padding: 7px 0;
  color: #6c7c61;
  font-size: 11px;
  line-height: 1.8;
}

@media (max-width: 1000px) {
  .dataset-summary {
    grid-template-columns: minmax(0, 1fr);
    gap: 19px;
  }

  .process-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 17px 0 0;
    border-top: 1px solid #d8e2d1;
    border-left: 0;
  }

  .process-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .process-heading,
  .process-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .process-heading {
    margin-bottom: 15px;
  }

  .process-heading h2 {
    font-size: 23px;
  }

  .dataset-summary {
    gap: 16px;
    padding: 20px;
  }

  .process-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px;
  }

  .process-steps {
    grid-template-columns: minmax(0, 1fr);
    gap: 11px;
  }

  .process-card {
    padding: 20px;
  }

  .step-topline {
    margin-bottom: 12px;
  }

  .process-footer {
    margin-top: 12px;
  }
}
</style>
