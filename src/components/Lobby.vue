<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  createRoom: () => Promise<string>
  joinRoom: (id: string) => Promise<void>
  startGame: () => void
  onlineState: any
}>()

const emit = defineEmits<{
  back: []
}>()

const roomIdInput = ref('')
const myRoomId = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleCreate() {
  loading.value = true
  errorMsg.value = ''
  try {
    const id = await props.createRoom()
    myRoomId.value = id
  } catch (e: any) {
    errorMsg.value = e.message || '创建失败'
  }
  loading.value = false
}

async function handleJoin() {
  const id = roomIdInput.value.trim().toUpperCase()
  if (!id) { errorMsg.value = '请输入房间号'; return }
  loading.value = true
  errorMsg.value = ''
  try {
    await props.joinRoom(id)
  } catch (e: any) {
    errorMsg.value = e.message || '加入失败'
  }
  loading.value = false
}

function copyRoomId() {
  navigator.clipboard.writeText(myRoomId.value)
}

function handleStart() {
  props.startGame()
}
</script>

<template>
  <div class="lobby">
    <div class="lobby-card">
      <h2 class="lobby-title">🎮 在线对战</h2>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- Initial: no room created/joined yet -->
      <div v-if="!myRoomId && !onlineState.opponentJoined && !onlineState.roomId" class="lobby-tabs">
        <div class="section">
          <h3>创建房间</h3>
          <p class="section-hint">创建一个新房间，获得房间号后分享给好友</p>
          <button class="btn btn-primary" :disabled="loading" @click="handleCreate">
            {{ loading ? '创建中...' : '创建房间' }}
          </button>
        </div>

        <div class="divider"><span>或</span></div>

        <div class="section">
          <h3>加入房间</h3>
          <p class="section-hint">输入好友分享的房间号加入对战</p>
          <div class="join-row">
            <input
              v-model="roomIdInput"
              class="input"
              placeholder="输入房间号"
              maxlength="6"
              @keyup.enter="handleJoin"
            />
            <button class="btn btn-secondary" :disabled="loading" @click="handleJoin">
              加入
            </button>
          </div>
        </div>
      </div>

      <!-- Room creator: waiting for opponent -->
      <div v-else-if="myRoomId && !onlineState.opponentJoined" class="waiting-room">
        <div class="room-id-display">
          <span class="room-id-label">房间号</span>
          <span class="room-id-value">{{ myRoomId }}</span>
          <button class="btn btn-small" @click="copyRoomId">📋 复制</button>
        </div>
        <div class="waiting-text">等待对手加入...</div>
        <div class="waiting-anim">⏳</div>
        <p class="share-hint">
          将房间号 <strong>{{ myRoomId }}</strong> 发送给好友即可对战
        </p>
      </div>

      <!-- Room creator: opponent joined -->
      <div v-else-if="myRoomId && onlineState.opponentJoined" class="joined-info">
        <div class="success-icon">✅</div>
        <p>对手已加入！</p>
        <p class="room-id-mini">房间号：{{ myRoomId }}</p>
        <button class="btn btn-primary" @click="handleStart">
          开始对战
        </button>
      </div>

      <!-- Room joiner: joined successfully -->
      <div v-else-if="!myRoomId && onlineState.roomId && !onlineState.opponentJoined" class="waiting-room">
        <div class="room-id-display">
          <span class="room-id-label">房间号</span>
          <span class="room-id-value">{{ onlineState.roomId }}</span>
        </div>
        <div class="waiting-text">已加入房间，等待房主确认...</div>
        <div class="waiting-anim">⏳</div>
      </div>

      <!-- Room joiner: opponent joined (need to start) -->
      <div v-else-if="!myRoomId && onlineState.opponentJoined" class="joined-info">
        <div class="success-icon">✅</div>
        <p>已加入房间！</p>
        <button class="btn btn-primary" @click="handleStart">
          开始对战
        </button>
      </div>

      <button class="btn btn-back" @click="emit('back')">← 返回</button>
    </div>
  </div>
</template>

<style scoped>
.lobby {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
}

.lobby-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 36px 32px;
  max-width: 440px;
  width: 100%;
  text-align: center;
}

.lobby-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: #ffd700;
  letter-spacing: 2px;
}

.section {
  margin: 16px 0;
}

.section h3 {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.section-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 10px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  margin: 8px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.join-row {
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 16px;
  font-family: inherit;
  text-align: center;
  letter-spacing: 4px;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #ffd700;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #f7971e, #ffd200);
  color: #1a1a2e;
  min-width: 160px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 210, 0, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.btn-small:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-back {
  margin-top: 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}

.btn-back:hover {
  color: rgba(255, 255, 255, 0.7);
}

.error-msg {
  background: rgba(231, 76, 60, 0.15);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 12px;
}

.waiting-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.room-id-display {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 12px 20px;
}

.room-id-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.room-id-value {
  font-size: 28px;
  font-weight: 900;
  color: #ffd700;
  letter-spacing: 6px;
}

.waiting-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.waiting-anim {
  font-size: 36px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.share-hint {
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  line-height: 1.5;
}

.share-hint strong {
  color: #ffd700;
}

.room-id-mini {
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
}

.joined-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon {
  font-size: 40px;
}
</style>
