import { reactive, ref, computed } from 'vue'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin

const state = reactive({
  connected: false,
  roomId: '',
  playerIndex: 0,
  phase: 'lobby', // lobby | waiting | playing | roundEnd
  round: 1,
  p1: {
    hp: 1.0, maxHp: 1.0, energy: 0, maxEnergy: 6, items: [], alive: true,
    selected: null as string | null,
    consecutiveBo: 0, kamehamehaUnlocked: false,
    unlockedSkills: [] as string[], unlockedDefenses: [] as string[],
  },
  p2: {
    hp: 1.0, maxHp: 1.0, energy: 0, maxEnergy: 6, items: [], alive: true,
    selected: null as string | null,
    consecutiveBo: 0, kamehamehaUnlocked: false,
    unlockedSkills: [] as string[], unlockedDefenses: [] as string[],
  },
  lastResult: null as any,
  p1Action: null as string | null,
  p2Action: null as string | null,
  itemIndex: 0,
  phase_label: 'basic' as string,
  waiting: false,
  error: '',
  opponentJoined: false,
  opponentDisconnected: false,
})

let socket: ReturnType<typeof io> | null = null
let actionConfirmed = ref(false)

export function useOnlineGame() {
  function connect() {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    })
    socket.on('connect', () => { state.connected = true })
    socket.on('disconnect', () => { state.connected = false })

    socket.on('room_joined', (data: any) => {
      state.roomId = data.roomId
      state.playerIndex = data.playerIndex
      applyServerState(data.state)
      state.phase = 'lobby'
    })

    socket.on('opponent_joined', () => {
      state.opponentJoined = true
    })

    socket.on('game_started', (data: any) => {
      applyServerState(data.state)
      state.phase = 'playing'
      state.opponentDisconnected = false
    })

    socket.on('action_confirmed', (data: any) => {
      actionConfirmed.value = true
      state.waiting = true
      if (state.playerIndex === 1) state.p1.selected = data.action
      else state.p2.selected = data.action
    })

    socket.on('opponent_selected', () => {
      if (state.playerIndex === 1) state.p2.selected = '?'
      else state.p1.selected = '?'
    })

    socket.on('round_result', (data: any) => {
      state.p1Action = data.p1Action
      state.p2Action = data.p2Action
      state.lastResult = data.result
      state.waiting = false
      applyServerState(data.state)
      state.round = data.round
      state.phase = 'roundEnd'
      state.p1.selected = null
      state.p2.selected = null
    })

    socket.on('new_round', (data: any) => {
      applyServerState(data.state)
      state.round = data.round
      state.lastResult = null
      state.p1Action = null
      state.p2Action = null
      state.phase = 'playing'
    })

    socket.on('opponent_disconnected', () => {
      state.opponentDisconnected = true
    })
  }

  function applyServerState(serverState: any) {
    if (!serverState) return
    const syncPlayer = (client: any, server: any) => {
      client.hp = server.hp
      client.energy = server.energy
      client.alive = server.alive
      client.items = server.items
      client.consecutiveBo = server.consecutiveBo ?? 0
      client.kamehamehaUnlocked = server.kamehamehaUnlocked ?? false
      client.unlockedSkills = server.unlockedSkills ?? []
      client.unlockedDefenses = server.unlockedDefenses ?? []
    }
    syncPlayer(state.p1, serverState.p1)
    syncPlayer(state.p2, serverState.p2)
    state.itemIndex = serverState.itemIndex ?? 0
    state.round = serverState.round ?? 1
    if (serverState.phase) state.phase_label = serverState.phase
  }

  function disconnect() {
    if (socket) { socket.disconnect(); socket = null }
    state.connected = false
    state.roomId = ''
    state.phase = 'lobby'
    state.opponentJoined = false
    state.opponentDisconnected = false
    state.p1Action = null
    state.p2Action = null
    state.lastResult = null
    state.waiting = false
  }

  function createRoom(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error('未连接')); return }
      socket.emit('create_room', null, (res: any) => {
        if (res.success) resolve(res.roomId)
        else reject(new Error(res.error))
      })
    })
  }

  function joinRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error('未连接')); return }
      socket.emit('join_room', { roomId }, (res: any) => {
        if (res.success) resolve()
        else reject(new Error(res.error))
      })
    })
  }

  function startGame() {
    if (!socket) return
    socket.emit('start_game')
  }

  function selectAction(action: string) {
    if (!socket) return
    actionConfirmed.value = false
    socket.emit('select_action', { action })
  }

  function continueGame() {
    if (!socket) return
    socket.emit('continue_game')
  }

  function getMyPlayer() {
    return state.playerIndex === 1 ? state.p1 : state.p2
  }

  function getOpponentPlayer() {
    return state.playerIndex === 1 ? state.p2 : state.p1
  }

  const myActionSelected = computed(() => {
    const p = getMyPlayer()
    return p.selected !== null
  })

  const opponentActionSelected = computed(() => {
    const p = getOpponentPlayer()
    return p.selected !== null
  })

  return {
    state,
    actionConfirmed,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startGame,
    selectAction,
    continueGame,
    getMyPlayer,
    getOpponentPlayer,
    myActionSelected,
    opponentActionSelected,
  }
}
