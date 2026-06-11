<template>
  <section id="facts" class="section info-section" aria-labelledby="facts-title">
    <div class="section-heading">
      <p class="eyebrow">Pneumonia facts</p>
      <h2 id="facts-title">What the analyzer is screening for</h2>
      <p>
        These notes summarize trusted public health guidance so the prediction is shown with useful clinical context.
      </p>
    </div>

    <div class="facts-grid">
      <article v-for="fact in pneumoniaFacts" :key="fact.title" class="fact-card">
        <h3>{{ fact.title }}</h3>
        <p>{{ fact.body }}</p>
        <a :href="fact.source.url" target="_blank" rel="noreferrer">
          Source: {{ fact.source.label }}
          <i class="pi pi-external-link" />
        </a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { pneumoniaFacts } from "../content/pneumoniaContent";
</script>
