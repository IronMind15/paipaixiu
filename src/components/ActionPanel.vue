<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  actions: { id: string; icon: string; label: string; cost: number }[]
  energy: number
  selected: string | null
  disabled: boolean
  consecutiveBo: number
  kamehamehaAvailable: boolean
  hasItems: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [action: string]
}>()

const basicActions = computed(() =>
  props.actions.filter(a => ['秀', '防', '波', '六克', '大防', '龟派气功波'].includes(a.id))
)

const itemActions = computed(() =>
  props.actions.filter(a => a.id.startsWith('item_'))
)

const skillActions = computed(() =>
  props.actions.filter(a =>
    !a.id.startsWith('item_') &&
    !['秀', '防', '波', '六克', '大防', '龟派气功波'].includes(a.id) &&
    !a.id.endsWith('防')
  )
)

const defenseActions = computed(() =>
  props.actions.filter(a =>
    (a.id.endsWith('防') || a.id === '天马防' || a.id === '冰箭防' || a.id === '龙爪防') &&
    !['秀', '防', '波', '六克', '大防'].includes(a.id)
  )
)

function isDisabled(action: { id: string; cost: number }): boolean {
  if (props.disabled) return true
  if (action.cost > 0 && props.energy < action.cost) return true
  return false
}

function handleClick(action: { id: string; cost: number }) {
  if (isDisabled(action)) return
  emit('select', action.id)
}

function actionColor(id: string): string {
  if (['秀', '防', '波', '六克', '大防'].includes(id)) return id
  if (id === '龟派气功波') return '龟派气功波'
  if (id.startsWith('item_')) return 'item'
  if (id.endsWith('防')) return 'defense-skill'
  return 'skill'
}
</script>

<template>
  <div class="action-panel" :class="{ compact }">
    <div class="section-label">基础</div>
    <div class="actions-row">
      <button
        v-for="action in basicActions"
        :key="action.id"
        class="action-btn"
        :class="{
          selected: selected === action.id,
          disabled: isDisabled(action),
        }"
        :disabled="isDisabled(action)"
        :data-color="actionColor(action.id)"
        @click="handleClick(action)"
      >
        <span class="action-icon">{{ action.icon }}</span>
        <span class="action-label">{{ action.label }}</span>
        <span class="action-cost">{{ action.cost > 0 ? `⚡${action.cost}` : '—' }}</span>
      </button>
    </div>

    <div v-if="itemActions.length > 0" class="section-label">道具</div>
    <div v-if="itemActions.length > 0" class="actions-row">
      <button
        v-for="action in itemActions"
        :key="action.id"
        class="action-btn"
        :class="{
          selected: selected === action.id,
          disabled: isDisabled(action),
        }"
        :disabled="isDisabled(action)"
        :data-color="'item'"
        @click="handleClick(action)"
      >
        <span class="action-icon">{{ action.icon }}</span>
        <span class="action-label">{{ action.label }}</span>
        <span class="action-cost">⚡{{ action.cost }}</span>
      </button>
    </div>

    <div v-if="skillActions.length > 0" class="section-label">技能</div>
    <div v-if="skillActions.length > 0" class="actions-row">
      <button
        v-for="action in skillActions"
        :key="action.id"
        class="action-btn"
        :class="{
          selected: selected === action.id,
          disabled: isDisabled(action),
        }"
        :disabled="isDisabled(action)"
        :data-color="'skill'"
        @click="handleClick(action)"
      >
        <span class="action-icon">{{ action.icon }}</span>
        <span class="action-label">{{ action.label }}</span>
        <span class="action-cost">⚡{{ action.cost }}</span>
      </button>
    </div>

    <div v-if="defenseActions.length > 0" class="section-label">防御技</div>
    <div v-if="defenseActions.length > 0" class="actions-row">
      <button
        v-for="action in defenseActions"
        :key="action.id"
        class="action-btn"
        :class="{
          selected: selected === action.id,
          disabled: isDisabled(action),
        }"
        :disabled="isDisabled(action)"
        :data-color="'defense-skill'"
        @click="handleClick(action)"
      >
        <span class="action-icon">{{ action.icon }}</span>
        <span class="action-label">{{ action.label }}</span>
        <span class="action-cost">—</span>
      </button>
    </div>

    <div v-if="!kamehamehaAvailable && consecutiveBo > 0" class="unlock-hint" :class="{ compact }">
      「波」连击 {{ consecutiveBo }}/3 解锁龟派气功波
    </div>
    <div v-if="!kamehamehaAvailable && energy >= 4" class="unlock-hint ready" :class="{ compact }">
      ⚡ 能量已达4点，可使用龟派气功波！
    </div>
  </div>
</template>

<style scoped>
.action-panel {
  flex-shrink: 0;
}

.section-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 2px;
  margin: 4px 0 3px;
  text-transform: uppercase;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 2px;
}

.action-btn {
  padding: 6px 8px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.action-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}

.action-btn:active:not(.disabled) {
  transform: translateY(0);
}

.action-btn.disabled {
  opacity: 0.25;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn.selected {
  border-color: #ffd700 !important;
  background: rgba(255, 215, 0, 0.15) !important;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  transform: scale(1.05);
}

.action-icon {
  font-size: 18px;
  line-height: 1;
}

.action-label {
  font-size: 11px;
}

.action-cost {
  font-size: 9px;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.35);
}

.compact .section-label {
  font-size: 8px;
  margin: 2px 0 2px;
}

.compact .action-btn {
  padding: 3px 5px;
  font-size: 10px;
  border-radius: 7px;
  gap: 2px;
}

.compact .action-icon {
  font-size: 13px;
}

.compact .action-label {
  font-size: 9px;
}

.compact .action-cost {
  font-size: 8px;
}

.compact .unlock-hint {
  font-size: 8px;
}

.compact .actions-row {
  gap: 3px;
  margin-bottom: 1px;
}

.unlock-hint {
  text-align: center;
  font-size: 10px;
  color: rgba(155, 89, 182, 0.7);
  letter-spacing: 0.5px;
  margin-top: 2px;
  animation: hintPulse 2s ease-in-out infinite;
}

.unlock-hint.ready {
  color: #ffd700;
  animation: none;
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

[data-color="秀"] { border-color: rgba(155, 89, 182, 0.35); }
[data-color="秀"]:hover:not(.disabled) { border-color: #9b59b6; }
[data-color="秀"].selected { border-color: #9b59b6 !important; background: rgba(155, 89, 182, 0.2) !important; }

[data-color="防"] { border-color: rgba(52, 152, 219, 0.35); }
[data-color="防"]:hover:not(.disabled) { border-color: #3498db; }
[data-color="防"].selected { border-color: #3498db !important; background: rgba(52, 152, 219, 0.2) !important; }

[data-color="波"] { border-color: rgba(231, 76, 60, 0.35); }
[data-color="波"]:hover:not(.disabled) { border-color: #e74c3c; }
[data-color="波"].selected { border-color: #e74c3c !important; background: rgba(231, 76, 60, 0.2) !important; }

[data-color="六克"] { border-color: rgba(231, 76, 60, 0.55); }
[data-color="六克"]:hover:not(.disabled) { border-color: #ff6b6b; }
[data-color="六克"].selected { border-color: #ff6b6b !important; background: rgba(255, 107, 107, 0.2) !important; }

[data-color="大防"] { border-color: rgba(46, 204, 113, 0.35); }
[data-color="大防"]:hover:not(.disabled) { border-color: #2ecc71; }
[data-color="大防"].selected { border-color: #2ecc71 !important; background: rgba(46, 204, 113, 0.2) !important; }

[data-color="龟派气功波"] { border-color: rgba(255, 215, 0, 0.5); }
[data-color="龟派气功波"]:hover:not(.disabled) { border-color: #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); }
[data-color="龟派气功波"].selected { border-color: #ffd700 !important; background: rgba(255, 215, 0, 0.25) !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }

[data-color="item"] { border-color: rgba(241, 196, 15, 0.35); }
[data-color="item"]:hover:not(.disabled) { border-color: #f1c40f; }
[data-color="item"].selected { border-color: #f1c40f !important; background: rgba(241, 196, 15, 0.15) !important; }

[data-color="skill"] { border-color: rgba(155, 89, 182, 0.5); }
[data-color="skill"]:hover:not(.disabled) { border-color: #9b59b6; box-shadow: 0 0 15px rgba(155, 89, 182, 0.3); }
[data-color="skill"].selected { border-color: #9b59b6 !important; background: rgba(155, 89, 182, 0.25) !important; box-shadow: 0 0 20px rgba(155, 89, 182, 0.4); }

[data-color="defense-skill"] { border-color: rgba(46, 204, 113, 0.5); }
[data-color="defense-skill"]:hover:not(.disabled) { border-color: #2ecc71; }
[data-color="defense-skill"].selected { border-color: #2ecc71 !important; background: rgba(46, 204, 113, 0.2) !important; }

@media (max-width: 768px) {
  .action-btn { padding: 4px 6px; }
  .action-icon { font-size: 15px; }
  .action-label { font-size: 10px; }
  .action-cost { font-size: 8px; }
}
</style>
