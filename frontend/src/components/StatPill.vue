<template>
  <div class="stat-pill">
    <strong>{{ value }}</strong>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string;
  label: string;
}>();
</script>
