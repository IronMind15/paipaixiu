<script setup lang="ts">
import { computed } from 'vue'
import { SPECIAL_SKILLS, DEFENSE_SKILLS } from '../core/constants'
import { ITEMS, ITEM_NAMES } from '../core/items'
import HpBar from './HpBar.vue'
import EnergyBar from './EnergyBar.vue'
import ItemBar from './ItemBar.vue'
import ActionPanel from './ActionPanel.vue'
import BattleAnimation from './BattleAnimation.vue'

const props = defineProps<{
  onlineState: any
  myIndex: number
}>()

const emit = defineEmits<{
  select: [action: string]
  continue: []
  leave: []
}>()

const myPlayer = computed(() => props.myIndex === 1 ? props.onlineState.p1 : props.onlineState.p2)
const oppPlayer = computed(() => props.myIndex === 1 ? props.onlineState.p2 : props.onlineState.p1)

const myActions = computed(() => getActionsForPlayer(myPlayer.value))

const canContinue = computed(() => props.onlineState.phase === 'roundEnd')

function getActionsForPlayer(p: any): { id: string; icon: string; label: string; cost: number }[] {
  const actions: { id: string; icon: string; label: string; cost: number }[] = []
  actions.push(
    { id: '秀', icon: '✨', label: '秀', cost: 0 },
    { id: '防', icon: '🛡️', label: '防', cost: 0 },
    { id: '波', icon: '🌊', label: '波', cost: 1 },
    { id: '六克', icon: '💢', label: '六克', cost: 2 },
    { id: '大防', icon: '🏰', label: '大防', cost: 0 },
  )

  const kameAvailable = p.kamehamehaUnlocked || p.energy >= 4
  if (kameAvailable) {
    actions.push({ id: '龟派气功波', icon: '🌀', label: '龟派气功波', cost: 2 })
  }

  for (const item of p.items) {
    const itemId = typeof item === 'string' ? item : item.id
    const def = ITEMS.find(i => i.id === itemId)
    actions.push({ id: `item_${itemId}`, icon: def?.icon ?? '❓', label: ITEM_NAMES[itemId] ?? itemId, cost: 1 })
  }

  for (const skillId of p.unlockedSkills || []) {
    const cfg = SPECIAL_SKILLS.find(s => s.id === skillId)
    if (cfg) actions.push({ id: cfg.id, icon: cfg.icon, label: cfg.label, cost: cfg.cost })
  }

  for (const defId of p.unlockedDefenses || []) {
    const cfg = DEFENSE_SKILLS.find(d => d.id === defId)
    if (cfg) actions.push({ id: cfg.id, icon: cfg.icon, label: cfg.label, cost: cfg.cost })
  }

  return actions
}

function handleSelect(action: string) {
  emit('select', action)
}

function handleClickCenter() {
  if (canContinue.value) {
    emit('continue')
  }
}
</script>

<template>
  <div class="online-wrapper">
    <header class="game-header">
      <div class="game-title-row">
        <button class="btn-leave" @click="emit('leave')">✕</button>
        <h1 class="game-title">✨ 拍拍秀 ✨</h1>
        <div class="room-badge">#{{ onlineState.roomId }}</div>
      </div>
      <div class="game-info">
        第 <span class="highlight">{{ onlineState.round }}</span> 回合
        ｜ {{ myIndex === 1 ? '玩家1' : '玩家2' }}
      </div>
    </header>

    <div class="battlefield">
      <div class="opponent-area">
        <div class="player-header">
          <div class="player-name opp-name">
            ⚔️ {{ myIndex === 1 ? '玩家 2' : '玩家 1' }}
          </div>
          <HpBar :hp="oppPlayer.hp" :max-hp="oppPlayer.maxHp" />
          <EnergyBar :energy="oppPlayer.energy" />
        </div>
        <ItemBar :items="oppPlayer.items" />
        <div class="opp-status">
          <span v-if="onlineState.phase === 'playing' && oppPlayer.selected" class="opp-ready">✅ 已选择</span>
          <span v-else-if="onlineState.phase === 'playing'" class="opp-waiting">⏳ 等待选择...</span>
        </div>
      </div>

      <div class="battle-center" @click="handleClickCenter">
        <template v-if="onlineState.phase === 'playing'">
          <div class="vs-large">⚡</div>
          <div v-if="myPlayer.selected && !oppPlayer.selected" class="waiting-text">等待对手...</div>
          <div v-else class="waiting-text">选择你的行动</div>
        </template>
        <template v-else-if="onlineState.phase === 'roundEnd'">
          <BattleAnimation
            :p1-action="onlineState.p1Action || ''"
            :p2-action="onlineState.p2Action || ''"
            :message="onlineState.lastResult?.message || ''"
            :p1-damage="onlineState.lastResult?.p1Damage || 0"
            :p2-damage="onlineState.lastResult?.p2Damage || 0"
            :show="true"
            @done="emit('continue')"
          />
        </template>
      </div>

      <div class="my-area">
        <div class="player-header">
          <div class="player-name my-name">
            ⚔️ {{ myIndex === 1 ? '玩家 1' : '玩家 2' }}
          </div>
          <HpBar :hp="myPlayer.hp" :max-hp="myPlayer.maxHp" />
          <EnergyBar :energy="myPlayer.energy" />
        </div>
        <ItemBar :items="myPlayer.items" />

        <ActionPanel
          :actions="myActions"
          :energy="myPlayer.energy"
          :selected="myPlayer.selected"
          :disabled="onlineState.phase !== 'playing' || myPlayer.selected !== null"
          :consecutive-bo="myPlayer.consecutiveBo || 0"
          :kamehameha-available="myPlayer.kamehamehaUnlocked || myPlayer.energy >= 4"
          :has-items="myPlayer.items.length > 0"
          @select="handleSelect"
        />
      </div>
    </div>

    <div v-if="onlineState.opponentDisconnected" class="disconnect-overlay">
      <div class="disconnect-card">
        <div class="disconnect-icon">🔌</div>
        <p>对手已断开连接</p>
        <button class="btn btn-leave-room" @click="emit('leave')">返回大厅</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.online-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.game-header {
  text-align: center;
  padding: 8px 12px 4px;
  flex-shrink: 0;
}

.game-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.btn-leave {
  position: absolute;
  left: 12px;
  top: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px 10px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
}

.btn-leave:hover {
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.3);
}

.room-badge {
  font-size: 11px;
  color: rgba(255, 215, 0, 0.6);
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 6px;
  padding: 2px 8px;
  letter-spacing: 1px;
}

.game-title {
  font-size: 22px;
  font-weight: 900;
  background: linear-gradient(90deg, #f7971e, #ffd200, #f7971e);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  animation: goldShine 3s ease-in-out infinite;
  margin: 0;
}

@keyframes goldShine {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.game-info {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 2px;
}

.game-info .highlight {
  color: #ffd700;
  font-weight: bold;
}

.battlefield {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 12px 10px;
  gap: 6px;
  min-height: 0;
}

.opponent-area, .my-area {
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
}

.opponent-area {
  border-color: rgba(231, 76, 60, 0.2);
  flex-shrink: 0;
}

.my-area {
  border-color: rgba(52, 152, 219, 0.2);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.player-name {
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
  white-space: nowrap;
}

.opp-name { color: #e74c3c; }
.my-name { color: #3498db; }

.opp-status {
  text-align: center;
  font-size: 11px;
  margin-top: 2px;
}

.opp-ready {
  color: #2ecc71;
}

.opp-waiting {
  color: rgba(255, 255, 255, 0.3);
}

.battle-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  cursor: pointer;
}

.vs-large {
  font-size: 28px;
  color: #ff4444;
  text-shadow: 0 0 30px rgba(255, 68, 68, 0.4);
  animation: vsPulse 2s ease-in-out infinite;
}

@keyframes vsPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}

.waiting-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
  letter-spacing: 1px;
}

.disconnect-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.disconnect-card {
  background: rgba(20, 20, 50, 0.95);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 16px;
  padding: 32px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.disconnect-icon {
  font-size: 40px;
}

.disconnect-card p {
  color: #e74c3c;
  font-size: 16px;
  font-weight: bold;
}

.btn-leave-room {
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-leave-room:hover {
  background: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.4);
  color: #e74c3c;
}

@media (max-width: 768px) {
  .game-title { font-size: 18px; }
  .opponent-area, .my-area { padding: 6px 8px; }
  .battle-center { min-height: 50px; }
  .vs-large { font-size: 22px; }
}
</style>
