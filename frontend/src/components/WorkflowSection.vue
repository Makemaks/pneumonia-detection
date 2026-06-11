<template>
  <section id="workflow" class="section workflow-section" aria-labelledby="workflow-title">
    <div class="section-heading">
      <p class="eyebrow">Model workflow</p>
      <h2 id="workflow-title">From X-ray to prediction</h2>
      <p>The interface now mirrors the backend pipeline so users understand what happens at each step.</p>
    </div>

    <div class="workflow-grid">
      <article v-for="(step, index) in workflowSteps" :key="step.title" class="workflow-card">
        <span class="step-index">{{ index + 1 }}</span>
        <i :class="step.icon" />
        <h3>{{ step.title }}</h3>
        <p>{{ step.body }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { workflowSteps } from "../content/pneumoniaContent";
</script>
