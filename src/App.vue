<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameState } from './composables/useGameState'
import { useOnlineGame } from './composables/useOnlineGame'
import PlayerArea from './components/PlayerArea.vue'
import BattleAnimation from './components/BattleAnimation.vue'
import Lobby from './components/Lobby.vue'
import OnlinePlay from './components/OnlinePlay.vue'
import { PHASE_LABELS } from './core/constants'

type GameMode = 'menu' | 'local' | 'online'

const mode = ref<GameMode>('menu')

// Local game
const {
  state,
  isPlaying,
  isRoundEnd,
  hasDamage,
  hasDeath,
  firstCondition,
  secondCondition,
  showBattle,
  isKamehamehaAvailable,
  getPlayerActions,
  selectAction,
  continueGame: localContinue,
} = useGameState()

// Online game
const {
  state: onlineState,
  connect: onlineConnect,
  disconnect: onlineDisconnect,
  createRoom,
  joinRoom,
  startGame,
  selectAction: onlineSelect,
  continueGame: onlineContinue,
} = useOnlineGame()

const p1Actions = computed(() => getPlayerActions(1))
const p2Actions = computed(() => getPlayerActions(2))

function handleSelect(player: 1 | 2, action: string) {
  selectAction(player, action)
}

function handleAnimDone() {
  if (isRoundEnd.value) localContinue()
}

function handleBattleClick() {
  if (isRoundEnd.value && (hasDamage.value || hasDeath.value)) {
    localContinue()
  }
}

// Online handlers
function goOnline() {
  mode.value = 'online'
  onlineConnect()
}

function goLocal() {
  mode.value = 'local'
}

function goMenu() {
  mode.value = 'menu'
  onlineDisconnect()
}

function handleOnlineSelect(action: string) {
  onlineSelect(action)
}

function handleOnlineContinue() {
  onlineContinue()
}
</script>

<template>
  <!-- ====== 主菜单 ====== -->
  <div v-if="mode === 'menu'" class="menu-screen">
    <div class="menu-card">
      <h1 class="menu-title">✨ 拍拍秀 ✨</h1>
      <p class="menu-sub">策略对战游戏</p>
      <div class="menu-buttons">
        <button class="menu-btn primary" @click="goLocal">🎮 本地对战</button>
        <button class="menu-btn secondary" @click="goOnline">🌐 在线对战</button>
      </div>
    </div>
  </div>

  <!-- ====== 在线大厅 ====== -->
  <div v-else-if="mode === 'online' && (onlineState.phase === 'lobby' || onlineState.phase === 'waiting')" class="lobby-screen">
    <Lobby
      :create-room="createRoom"
      :join-room="joinRoom"
      :start-game="startGame"
      :online-state="onlineState"
      @back="goMenu"
    />
  </div>

  <!-- ====== 在线对战 ====== -->
  <div v-else-if="mode === 'online' && (onlineState.phase === 'playing' || onlineState.phase === 'roundEnd')">
    <OnlinePlay
      :online-state="onlineState"
      :my-index="onlineState.playerIndex"
      @select="handleOnlineSelect"
      @continue="handleOnlineContinue"
      @leave="goMenu"
    />
  </div>

  <!-- ====== 本地对战 ====== -->
  <div v-else class="game-wrapper">
    <header class="game-header">
      <div class="game-title-row">
        <button class="btn-back-menu" @click="goMenu">← 返回</button>
        <h1 class="game-title">✨ 拍拍秀 ✨</h1>
      </div>
      <div class="game-info">
        第 <span class="highlight">{{ state.round }}</span> 回合
        ｜ <span class="phase-badge">{{ PHASE_LABELS[state.phase] }}</span>
        <span v-if="state.itemIndex > 0 && state.itemIndex <= 11" class="item-progress">
          ｜ 道具 {{ state.itemIndex }}/11
        </span>
      </div>
    </header>

    <div class="battlefield">
      <PlayerArea
        :player="state.p2"
        :player-index="2"
        :disabled="!isPlaying"
        :is-game-over="false"
        :actions="p2Actions"
        :kamehameha-available="isKamehamehaAvailable(2)"
        :compact="true"
        @select="handleSelect"
      />

      <div class="battle-center" @click="handleBattleClick">
        <template v-if="firstCondition">
          <div class="vs-large">⚡</div>
          <div class="vs-sub">选择行动</div>
        </template>
        <template v-else-if="secondCondition">
          <div class="vs-large">⚡</div>
          <div class="vs-sub waiting">等待对手...</div>
        </template>
        <template v-else-if="showBattle">
          <BattleAnimation
            :p1-action="state.lastResult!.p1Action"
            :p2-action="state.lastResult!.p2Action"
            :message="state.lastResult!.message"
            :p1-damage="state.lastResult!.p1Damage"
            :p2-damage="state.lastResult!.p2Damage"
            :show="true"
            @done="handleAnimDone"
          />
        </template>
      </div>

      <PlayerArea
        :player="state.p1"
        :player-index="1"
        :disabled="!isPlaying"
        :is-game-over="false"
        :actions="p1Actions"
        :kamehameha-available="isKamehamehaAvailable(1)"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<style scoped>
/* ====== Menu ====== */
.menu-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
}

.menu-card {
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.menu-title {
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(90deg, #f7971e, #ffd200, #f7971e);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 8px;
  animation: goldShine 3s ease-in-out infinite;
  margin-bottom: 8px;
}

@keyframes goldShine {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.menu-sub {
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
  letter-spacing: 4px;
  margin-bottom: 40px;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.menu-btn {
  padding: 14px 48px;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  letter-spacing: 2px;
  min-width: 240px;
}

.menu-btn.primary {
  background: linear-gradient(135deg, #f7971e, #ffd200);
  color: #1a1a2e;
}

.menu-btn.primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 210, 0, 0.3);
}

.menu-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.menu-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-3px);
}

/* ====== Local Game ====== */
.game-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.game-header {
  text-align: center;
  padding: 8px 0 4px;
  flex-shrink: 0;
}

.game-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.btn-back-menu {
  position: absolute;
  left: 12px;
  top: 8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}

.btn-back-menu:hover {
  color: rgba(255, 255, 255, 0.7);
}

.game-title {
  font-size: 24px;
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

.game-info {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  letter-spacing: 1px;
  margin-top: 2px;
}

.game-info .highlight {
  color: #ffd700;
  font-weight: bold;
}

.phase-badge {
  display: inline-block;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 6px;
  padding: 1px 8px;
  font-size: 10px;
  color: #ffd700;
}

.item-progress {
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
}

.battlefield {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 12px 10px;
  gap: 6px;
  min-height: 0;
}

.battle-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 80px;
  cursor: pointer;
}

.vs-large {
  font-size: 32px;
  color: #ff4444;
  text-shadow: 0 0 30px rgba(255, 68, 68, 0.4);
  animation: vsPulse 2s ease-in-out infinite;
}

@keyframes vsPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}

.vs-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
  letter-spacing: 2px;
}

.vs-sub.waiting {
  color: #f39c12;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (max-width: 768px) {
  .menu-title { font-size: 32px; letter-spacing: 4px; }
  .game-title { font-size: 18px; }
  .battlefield { padding: 2px 8px 8px; gap: 4px; }
  .battle-center { min-height: 60px; }
  .vs-large { font-size: 24px; }
}
</style>
