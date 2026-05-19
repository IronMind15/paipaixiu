<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hp: number
  maxHp: number
}>()

const hearts = computed(() => {
  const result: { type: 'full' | 'half' | 'lost' }[] = []
  const full = Math.floor(props.hp)
  const hasHalf = props.hp % 1 >= 0.5
  for (let i = 0; i < props.maxHp; i++) {
    if (i < full) result.push({ type: 'full' })
    else if (i === full && hasHalf) result.push({ type: 'half' })
    else result.push({ type: 'lost' })
  }
  return result
})
</script>

<template>
  <div class="hp-bar">
    <div class="hp-hearts">
      <span
        v-for="(heart, i) in hearts"
        :key="i"
        class="heart"
        :class="heart.type"
      >❤️</span>
    </div>
    <span class="hp-text">{{ hp.toFixed(1) }}</span>
  </div>
</template>

<style scoped>
.hp-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hp-hearts {
  display: flex;
  gap: 2px;
  font-size: 18px;
}
.heart {
  transition: all 0.3s;
}
.heart.lost {
  opacity: 0.15;
  filter: grayscale(1);
  transform: scale(0.9);
}
.heart.half {
  opacity: 0.6;
  filter: sepia(0.5);
}
.hp-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: bold;
  min-width: 2.5em;
}
</style>
