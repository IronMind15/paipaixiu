<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getItemById, ITEM_NAMES } from '../core/items'
import { BASIC_ACTIONS, SPECIAL_SKILLS, DEFENSE_SKILLS } from '../core/constants'

const props = defineProps<{
  p1Action: string
  p2Action: string
  message: string
  p1Damage: number
  p2Damage: number
  show: boolean
}>()

const emit = defineEmits<{
  done: []
}>()

const phase = ref<string>('idle')
const flyDir = ref<'left' | 'right' | 'both' | 'none'>('none')

let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  startAnimation()
})

function startAnimation() {
  phase.value = 'reveal'
  timer = setTimeout(() => {
    phase.value = 'fly'
    flyDir.value = getFlyDirection()
    timer = setTimeout(() => {
      phase.value = 'impact'
      timer = setTimeout(() => {
        phase.value = 'message'
        timer = setTimeout(() => {
          phase.value = 'done'
          const hasDmg = props.p1Damage > 0 || props.p2Damage > 0
          if (!hasDmg) {
            emit('done')
          }
        }, 1200)
      }, 600)
    }, 500)
  }, 400)
}

function getFlyDirection(): 'left' | 'right' | 'both' | 'none' {
  const a1Attack = isAttackAction(props.p1Action)
  const a2Attack = isAttackAction(props.p2Action)
  if (a1Attack && a2Attack) return 'both'
  if (a1Attack) return 'right'
  if (a2Attack) return 'left'
  return 'none'
}

function isAttackAction(a: string): boolean {
  return a === '波' || a === '六克' || a === '龟派气功波' || a.startsWith('item_') || SPECIAL_SKILLS.some(s => s.id === a)
}

function getActionIcon(action: string): string {
  const basic = BASIC_ACTIONS.find(a => a.id === action)
  if (basic) return basic.icon
  const skill = SPECIAL_SKILLS.find(a => a.id === action)
  if (skill) return skill.icon
  const defs = DEFENSE_SKILLS.find(a => a.id === action)
  if (defs) return defs.icon
  if (action.startsWith('item_')) {
    const item = getItemById(action.slice(5))
    return item?.icon ?? '❓'
  }
  return '❓'
}


</script>

<template>
  <div class="battle-anim" :class="{ active: show }">
    <div v-if="phase !== 'idle'" class="anim-content">
      <div class="action-display p1-action" :class="{ revealed: phase !== 'idle' }">
        <span class="action-icon">{{ getActionIcon(p1Action) }}</span>
        <span class="action-label">{{ p1Action.startsWith('item_') ? (ITEM_NAMES[p1Action.slice(5)] || '?') : p1Action }}</span>
      </div>

      <div class="vs-area">
        <div v-if="phase === 'fly' && flyDir === 'right'" class="projectile fly-right">
          {{ getActionIcon(p1Action) }}
        </div>
        <div v-if="phase === 'fly' && flyDir === 'left'" class="projectile fly-left">
          {{ getActionIcon(p2Action) }}
        </div>
        <div v-if="phase === 'fly' && flyDir === 'both'" class="projectile-pair">
          <span class="proj proj-right">{{ getActionIcon(p1Action) }}</span>
          <span class="proj proj-left">{{ getActionIcon(p2Action) }}</span>
        </div>

        <div v-if="phase === 'impact'" class="impact-container">
          <div v-if="p1Damage > 0" class="impact-hit p1-hit">💥</div>
          <div v-if="p2Damage > 0" class="impact-hit p2-hit">💥</div>
          <div v-if="p1Damage === 0 && p2Damage === 0" class="impact-block">🛡️</div>
          <div v-if="p1Damage > 0" class="damage-num p1-dmg">-{{ p1Damage }}</div>
          <div v-if="p2Damage > 0" class="damage-num p2-dmg">-{{ p2Damage }}</div>
        </div>

        <div v-if="phase === 'message' || phase === 'done'" class="result-message">
          <div class="msg-text">{{ message }}</div>
        </div>

        <div v-if="phase === 'done' && (p1Damage > 0 || p2Damage > 0)" class="click-hint">
          点击继续
        </div>
      </div>

      <div class="action-display p2-action" :class="{ revealed: phase !== 'idle' }">
        <span class="action-icon">{{ getActionIcon(p2Action) }}</span>
        <span class="action-label">{{ p2Action.startsWith('item_') ? (ITEM_NAMES[p2Action.slice(5)] || '?') : p2Action }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-anim {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.anim-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
  height: 100%;
  position: relative;
}

.action-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.4s ease;
  min-width: 70px;
}

.action-display.revealed {
  opacity: 1;
  transform: scale(1);
}

.action-display .action-icon {
  font-size: 40px;
  line-height: 1;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
}

.action-display .action-label {
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.8);
}

.vs-area {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.projectile {
  font-size: 36px;
  position: absolute;
  animation-duration: 0.5s;
  animation-fill-mode: forwards;
}

.projectile.fly-right {
  animation-name: flyRight;
  animation-timing-function: ease-in;
}

.projectile.fly-left {
  animation-name: flyLeft;
  animation-timing-function: ease-in;
}

@keyframes flyRight {
  0% { transform: translateX(-80px) scale(0.5); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateX(0) scale(1.2); opacity: 1; }
}

@keyframes flyLeft {
  0% { transform: translateX(80px) scale(0.5); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateX(0) scale(1.2); opacity: 1; }
}

.projectile-pair {
  position: absolute;
  display: flex;
  gap: 10px;
}

.proj {
  font-size: 32px;
  animation-duration: 0.5s;
  animation-fill-mode: forwards;
}

.proj-right {
  animation-name: flyRight;
  animation-timing-function: ease-in;
}

.proj-left {
  animation-name: flyLeft;
  animation-timing-function: ease-in;
}

.impact-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: impactPop 0.4s ease-out;
}

@keyframes impactPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.impact-hit {
  font-size: 48px;
  animation: hitFlash 0.6s ease-out;
}

@keyframes hitFlash {
  0% { transform: scale(0.3); opacity: 0; }
  40% { transform: scale(1.4); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.impact-block {
  font-size: 42px;
  animation: blockShine 0.6s ease-out;
}

@keyframes blockShine {
  0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.damage-num {
  font-size: 28px;
  font-weight: 900;
  animation: dmgPop 0.5s ease-out;
  text-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
}

.p1-dmg { color: #e74c3c; }
.p2-dmg { color: #e74c3c; }

@keyframes dmgPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.result-message {
  text-align: center;
  animation: msgFade 0.4s ease-out;
}

.msg-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  max-width: 200px;
}

@keyframes msgFade {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.click-hint {
  position: absolute;
  bottom: -30px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>
