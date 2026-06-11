<template>
  <header class="site-header">
    <a class="brand" href="#analyze" aria-label="AI Lung Analyzer home">
      <span class="brand-mark"><i class="pi pi-heart-pulse" /></span>
      <span>
        <strong>AI Lung Analyzer</strong>
        <small>Pneumonia screening UI</small>
      </span>
    </a>

    <nav class="site-nav" aria-label="Primary navigation">
      <a v-for="section in sections" :key="section.href" :href="section.href">
        {{ section.label }}
      </a>
    </nav>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  sections: Array<{
    label: string;
    href: string;
  }>;
}>();
</script>
