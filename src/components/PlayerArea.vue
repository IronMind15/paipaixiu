<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState } from '../core/types'
import HpBar from './HpBar.vue'
import EnergyBar from './EnergyBar.vue'
import ItemBar from './ItemBar.vue'
import ActionPanel from './ActionPanel.vue'

const props = defineProps<{
  player: PlayerState
  playerIndex: 1 | 2
  disabled: boolean
  isGameOver: boolean
  actions: { id: string; icon: string; label: string; cost: number }[]
  kamehamehaAvailable: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [player: 1 | 2, action: string]
}>()

const isP1 = computed(() => props.playerIndex === 1)

const statusText = computed(() => {
  if (props.isGameOver) return ''
  if (props.player.selected) return '✅ 已选择'
  return '👆 选择行动'
})

const statusClass = computed(() => {
  if (props.player.selected) return 'ready'
  return ''
})

function handleSelect(action: string) {
  emit('select', props.playerIndex, action)
}
</script>

<template>
  <div
    class="player-area"
    :class="[
      isP1 ? 'p1' : 'p2',
      { winner: !player.alive && playerIndex === 2, loser: !player.alive, compact }
    ]"
  >
    <div class="player-header">
      <div class="player-name">
        {{ isP1 ? '⚔️ 玩家 1' : '⚔️ 玩家 2' }}
      </div>
      <HpBar :hp="player.hp" :max-hp="player.maxHp" />
      <EnergyBar :energy="player.energy" />
    </div>

    <ItemBar :items="player.items" />

    <ActionPanel
      :actions="actions"
      :energy="player.energy"
      :selected="player.selected"
      :disabled="disabled"
      :consecutive-bo="player.consecutiveBo"
      :kamehameha-available="kamehamehaAvailable"
      :has-items="player.items.length > 0"
      :compact="compact"
      @select="handleSelect"
    />

    <div class="selection-status">
      <div class="status-text" :class="statusClass">{{ statusText }}</div>
    </div>
  </div>
</template>

<style scoped>
.player-area {
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.player-area.compact {
  padding: 6px 12px;
}

.player-area.p1 {
  border-color: rgba(52, 152, 219, 0.25);
}

.player-area.p1 .player-name {
  color: #3498db;
}

.player-area.p2 {
  border-color: rgba(231, 76, 60, 0.25);
}

.player-area.p2 .player-name {
  color: #e74c3c;
}

.player-area.winner {
  border-color: #ffd700 !important;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(255, 215, 0, 0.05);
  animation: winGlow 1.5s ease-in-out infinite;
}

@keyframes winGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.5); }
}

.player-area.loser {
  opacity: 0.4;
  filter: grayscale(0.6);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.compact .player-header {
  margin-bottom: 2px;
}

.player-name {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
  white-space: nowrap;
}

.compact .player-name {
  font-size: 14px;
}

.selection-status {
  text-align: center;
  flex-shrink: 0;
  padding-top: 2px;
  min-height: 20px;
}

.compact .selection-status {
  min-height: 16px;
}

.status-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

.status-text.ready {
  color: #2ecc71;
}

@media (max-width: 768px) {
  .player-area { padding: 8px 10px; }
  .player-area.compact { padding: 4px 8px; }
  .player-name { font-size: 14px; }
  .compact .player-name { font-size: 12px; }
}
</style>
