<script setup lang="ts">
import { ENERGY_MAX } from '../core/constants'

defineProps<{
  energy: number
}>()
</script>

<template>
  <div class="energy-display">
    <span class="energy-label">⚡</span>
    <div class="bolts">
      <span
        v-for="i in ENERGY_MAX"
        :key="i"
        class="bolt"
        :class="{ empty: i > energy }"
      >⚡</span>
    </div>
  </div>
</template>

<style scoped>
.energy-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  font-size: 15px;
  margin-left: auto;
  flex-shrink: 0;
}
.energy-label {
  color: #ffd700;
  font-size: 16px;
}
.bolts {
  display: flex;
  gap: 1px;
}
.bolt {
  transition: all 0.3s;
  font-size: 14px;
}
.bolt.empty {
  opacity: 0.1;
  filter: grayscale(1);
}
</style>
