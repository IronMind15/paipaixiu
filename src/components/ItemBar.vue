<script setup lang="ts">
import type { ItemDef } from '../core/types'
import { getItemDamage } from '../core/items'

defineProps<{
  items: ItemDef[]
}>()

function tierLabel(tier: 1 | 2 | 3): string {
  switch (tier) {
    case 1: return '★'
    case 2: return '★★'
    case 3: return '★★★'
  }
}
</script>

<template>
  <div class="items-bar">
    <div
      v-for="item in items"
      :key="item.id"
      class="item-badge"
      :title="`${item.name}: ${item.desc} (伤害${getItemDamage(item.damageTier)})`"
    >
      <span class="item-icon">{{ item.icon }}</span>
      <span class="item-name">{{ item.name }}</span>
      <span class="item-tier">{{ tierLabel(item.damageTier) }}</span>
    </div>
    <span v-if="items.length === 0" class="no-items">—</span>
  </div>
</template>

<style scoped>
.items-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
  min-height: 26px;
  align-items: center;
}
.item-badge {
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 8px;
  padding: 2px 7px;
  font-size: 11px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 3px;
  animation: itemAppear 0.4s ease-out;
  white-space: nowrap;
}
@keyframes itemAppear {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.item-icon {
  font-size: 13px;
}
.item-name {
  font-size: 10px;
}
.item-tier {
  font-size: 8px;
  color: rgba(255, 215, 0, 0.5);
}
.no-items {
  color: rgba(255, 255, 255, 0.15);
  font-size: 12px;
}
</style>
