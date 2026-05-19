import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Server } from 'socket.io'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'
const distDir = join(__dirname, '..', 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const ITEMS = [
  'tianma', 'bingjian', 'longzhua', 'bagua', 'shuiqiu', 'huoqiu',
  'xiaojingang', 'dajingang', 'toukui', 'shoukui', 'jiaokui'
]
const ENERGY_MAX = 6
const SKILL_IDS = ['天马流星拳', '冰天雪地', '龙爪锁链', '烫水八卦炉', '烈焰龙爪']
const DEFENSE_IDS = ['天马防', '冰箭防', '龙爪防']
const KAME_UNLOCK_CONSECUTIVE = 3
const UNLOCK_CONSECUTIVE = 3

const ITEM_SKILL_MAP = {
  tianma: { skillId: '天马流星拳', defenseId: '天马防' },
  bingjian: { skillId: '冰天雪地', defenseId: '冰箭防' },
  longzhua: { skillId: '龙爪锁链', defenseId: '龙爪防' },
  bagua: { skillId: '烫水八卦炉' },
}

// ── Actions helpers ──────────────────────────────────────────

function getActionCost(action) {
  if (action === '波') return 1
  if (action === '六克') return 2
  if (action === '龟派气功波') return 2
  if (action.startsWith('item_')) return 1
  if (SKILL_IDS.includes(action)) return 2
  return 0
}

function isAttack(action) {
  return action === '波' || action === '六克' || action === '龟派气功波' ||
    action.startsWith('item_') || SKILL_IDS.includes(action)
}

function isDefend(action) {
  return action === '防' || action === '大防' || DEFENSE_IDS.includes(action)
}

function isItemAction(action) {
  return action.startsWith('item_')
}

function getItemId(action) {
  return action.startsWith('item_') ? action.slice(5) : null
}

function getItemDamage(itemId) {
  const tierMap = {
    tianma: 1, bingjian: 1, longzhua: 1,
    bagua: 2, shuiqiu: 2, huoqiu: 2,
    xiaojingang: 3, dajingang: 3, toukui: 3, shoukui: 3, jiaokui: 3
  }
  const tier = tierMap[itemId] || 1
  return tier === 1 ? 0.5 : tier === 2 ? 0.75 : 1.0
}

function getAttackDamage(action) {
  if (action === '波') return 0.5
  if (action === '六克' || action === '龟派气功波') return 1.0
  if (SKILL_IDS.includes(action)) return 1.0
  if (isItemAction(action)) {
    const id = getItemId(action)
    return id ? getItemDamage(id) : 0
  }
  return 0
}

// ── Combat resolution ────────────────────────────────────────

function resolveAttackVsAttack(a1, a2) {
  const d1 = getAttackDamage(a1)
  const d2 = getAttackDamage(a2)
  if (d1 > d2) return { p1Damage: d2, p2Damage: 0 }
  if (d2 > d1) return { p1Damage: 0, p2Damage: d1 }
  return { p1Damage: 0, p2Damage: 0 }
}

function resolveAttackVsDefend(attack, defend) {
  if (defend === '防') {
    if (attack === '波') return 0
    if (attack === '六克') return 0.5
    if (attack === '龟派气功波' || SKILL_IDS.includes(attack)) return 1.0
    if (isItemAction(attack)) {
      const id = getItemId(attack)
      const dmg = id ? getItemDamage(id) : 0
      if (dmg <= 0.5) return 0
      if (dmg <= 0.75) return 0.375
      return 1.0
    }
  } else if (defend === '大防') {
    if (attack === '波') return 0.5
    if (attack === '六克') return 1.0
    if (attack === '龟派气功波' || SKILL_IDS.includes(attack)) return 0
    if (isItemAction(attack)) {
      const id = getItemId(attack)
      const dmg = id ? getItemDamage(id) : 0
      if (dmg >= 1.0) return 0.5
      return 0
    }
  } else if (DEFENSE_IDS.includes(defend)) {
    if (attack === '波') return 0
    if (isItemAction(attack)) {
      const id = getItemId(attack)
      const dmg = id ? getItemDamage(id) : 0
      if (dmg <= 0.75) return 0
      return getAttackDamage(attack)
    }
    return getAttackDamage(attack)
  }
  return 0
}

function resolveRound(a1, a2) {
  let p1Damage = 0, p2Damage = 0
  let p1EnergyGain = 0, p2EnergyGain = 0
  const p1Cost = getActionCost(a1)
  const p2Cost = getActionCost(a2)

  if (a1 === '秀') p1EnergyGain = 1
  if (a2 === '秀') p2EnergyGain = 1

  if (a1 === a2) return { p1Damage: 0, p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }

  const p1Atk = isAttack(a1), p2Atk = isAttack(a2)
  const p1Def = isDefend(a1), p2Def = isDefend(a2)

  if (a1 === '秀' && p2Atk) return { p1Damage: 1.0, p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
  if (a2 === '秀' && p1Atk) return { p1Damage: 0, p2Damage: 1.0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
  if (a1 === '秀' && p2Def) return { p1Damage: 0, p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
  if (a2 === '秀' && p1Def) return { p1Damage: 0, p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }

  if (p1Def && p2Def) return { p1Damage: 0, p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }

  if (p1Atk && p2Atk) {
    const r = resolveAttackVsAttack(a1, a2)
    return { p1Damage: r.p1Damage, p2Damage: r.p2Damage, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
  }

  if (p1Atk && p2Def) {
    return { p1Damage: resolveAttackVsDefend(a1, a2), p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
  }
  if (p2Atk && p1Def) {
    return { p1Damage: 0, p2Damage: resolveAttackVsDefend(a2, a1), p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
  }

  return { p1Damage: 0, p2Damage: 0, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost }
}

// ── Skill / combo tracking ───────────────────────────────────

function updateActionTracking(p, usedAction) {
  if (usedAction === '波') {
    p.consecutiveBo = (p.consecutiveBo || 0) + 1
    if (p.consecutiveBo >= KAME_UNLOCK_CONSECUTIVE && !p.kamehamehaUnlocked) {
      p.kamehamehaUnlocked = true
    }
  } else if (usedAction !== '龟派气功波') {
    p.consecutiveBo = 0
  }

  if (usedAction.startsWith('item_')) {
    const itemId = usedAction.slice(5)
    if (!p.itemActionCount) p.itemActionCount = {}
    if (p.lastItemAction === itemId) {
      p.itemActionCount[itemId] = (p.itemActionCount[itemId] || 1) + 1
    } else {
      p.itemActionCount = {}
      p.itemActionCount[itemId] = 1
    }
    p.lastItemAction = itemId

    const unlockInfo = ITEM_SKILL_MAP[itemId]
    if (unlockInfo && p.itemActionCount[itemId] >= UNLOCK_CONSECUTIVE) {
      if (!p.unlockedSkills) p.unlockedSkills = []
      if (!p.unlockedDefenses) p.unlockedDefenses = []
      if (!p.unlockedSkills.includes(unlockInfo.skillId)) {
        p.unlockedSkills.push(unlockInfo.skillId)
      }
      if (unlockInfo.defenseId && !p.unlockedDefenses.includes(unlockInfo.defenseId)) {
        p.unlockedDefenses.push(unlockInfo.defenseId)
      }
    }
  } else {
    p.itemActionCount = {}
    p.lastItemAction = null
  }
}

function checkCrossCombo(a1, a2, p1, p2) {
  const getId = (a) => a.startsWith('item_') ? a.slice(5) : null
  const id1 = getId(a1), id2 = getId(a2)
  if ((id1 === 'longzhua' && id2 === 'bagua') || (id1 === 'bagua' && id2 === 'longzhua')) {
    const longzhuaUser = id1 === 'longzhua' ? p1 : p2
    if (!longzhuaUser.unlockedSkills) longzhuaUser.unlockedSkills = []
    if (!longzhuaUser.unlockedSkills.includes('烈焰龙爪')) {
      longzhuaUser.unlockedSkills.push('烈焰龙爪')
    }
  }
}

function makePlayerState() {
  return {
    hp: 1.0, maxHp: 1.0,
    energy: 0, maxEnergy: ENERGY_MAX,
    items: [], alive: true,
    consecutiveBo: 0,
    kamehamehaUnlocked: false,
    unlockedSkills: [],
    unlockedDefenses: [],
    itemActionCount: {},
    lastItemAction: null,
  }
}

// ── Room management ──────────────────────────────────────────

function createRoomState() {
  return {
    round: 1,
    p1: makePlayerState(),
    p2: makePlayerState(),
    selected: { p1: null, p2: null },
    itemIndex: 0,
    lastResult: null,
    phase: 'basic',
  }
}

function executeRound(room) {
  const a1 = room.state.selected.p1
  const a2 = room.state.selected.p2

  updateActionTracking(room.state.p1, a1)
  updateActionTracking(room.state.p2, a2)
  checkCrossCombo(a1, a2, room.state.p1, room.state.p2)

  const result = resolveRound(a1, a2)

  const s = room.state
  s.p1.energy = Math.min(ENERGY_MAX, Math.max(0, s.p1.energy + result.p1EnergyGain - result.p1EnergyCost))
  s.p2.energy = Math.min(ENERGY_MAX, Math.max(0, s.p2.energy + result.p2EnergyGain - result.p2EnergyCost))
  s.p1.hp = Math.max(0, s.p1.hp - result.p1Damage)
  s.p2.hp = Math.max(0, s.p2.hp - result.p2Damage)
  s.p1.alive = s.p1.hp > 0
  s.p2.alive = s.p2.hp > 0
  s.lastResult = result
  return result
}

function advanceRound(room) {
  const s = room.state
  const p1Died = s.p1.hp <= 0
  const p2Died = s.p2.hp <= 0

  let roundWinner = null
  if (!s.p1.alive && !s.p2.alive) roundWinner = 0
  else if (!s.p1.alive) roundWinner = 2
  else if (!s.p2.alive) roundWinner = 1
  else if (s.lastResult) {
    if (s.lastResult.p1Damage > 0 && s.lastResult.p2Damage === 0) roundWinner = 2
    else if (s.lastResult.p2Damage > 0 && s.lastResult.p1Damage === 0) roundWinner = 1
  }

  if (s.phase === 'basic' && roundWinner && roundWinner !== 0 && s.itemIndex < ITEMS.length) {
    const winnerKey = roundWinner === 1 ? 'p1' : 'p2'
    s[winnerKey].items.push(ITEMS[s.itemIndex])
    s.itemIndex++
  }
  if (s.itemIndex >= ITEMS.length && s.phase === 'basic') s.phase = 'advanced'

  if (p1Died || p2Died) { s.p1.energy = 0; s.p2.energy = 0 }

  s.p1.hp = 1.0; s.p2.hp = 1.0
  s.p1.alive = true; s.p2.alive = true
  s.selected.p1 = null; s.selected.p2 = null
  s.lastResult = null
  s.round++
}

function getPublicState(s) {
  return {
    round: s.round,
    phase: s.phase,
    itemIndex: s.itemIndex,
    p1: {
      hp: s.p1.hp, maxHp: s.p1.maxHp,
      energy: s.p1.energy, maxEnergy: s.p1.maxEnergy,
      items: s.p1.items, alive: s.p1.alive,
      consecutiveBo: s.p1.consecutiveBo,
      kamehamehaUnlocked: s.p1.kamehamehaUnlocked,
      unlockedSkills: s.p1.unlockedSkills,
      unlockedDefenses: s.p1.unlockedDefenses,
    },
    p2: {
      hp: s.p2.hp, maxHp: s.p2.maxHp,
      energy: s.p2.energy, maxEnergy: s.p2.maxEnergy,
      items: s.p2.items, alive: s.p2.alive,
      consecutiveBo: s.p2.consecutiveBo,
      kamehamehaUnlocked: s.p2.kamehamehaUnlocked,
      unlockedSkills: s.p2.unlockedSkills,
      unlockedDefenses: s.p2.unlockedDefenses,
    },
  }
}

// ── HTTP server ──────────────────────────────────────────────

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0]
  if (urlPath === '/') urlPath = '/index.html'

  const filePath = join(distDir, urlPath)
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403); res.end('Forbidden')
    return
  }

  if (!existsSync(filePath)) {
    const indexPath = join(distDir, 'index.html')
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf-8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(content)
    } else {
      res.writeHead(404); res.end('Not Found')
    }
    return
  }

  const ext = extname(filePath)
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  const content = readFileSync(filePath)
  res.writeHead(200, { 'Content-Type': contentType })
  res.end(content)
}

const httpServer = createServer((req, res) => {
  if (isProduction) {
    serveStatic(req, res)
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('拍拍秀 游戏服务器运行中\nWebSocket 已就绪')
  }
})

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})

// ── Room store ───────────────────────────────────────────────

const rooms = new Map()

function generateId() {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

function findRoomByPlayer(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === socketId)) return room
  }
  return null
}

// ── WebSocket ────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('create_room', (_, callback) => {
    const roomId = generateId()
    const room = {
      id: roomId,
      players: [{ id: socket.id, playerIndex: 1, ready: false }],
      state: createRoomState(),
    }
    rooms.set(roomId, room)
    socket.join(roomId)
    socket.emit('room_joined', { roomId, playerIndex: 1, state: getPublicState(room.state) })
    if (callback) callback({ success: true, roomId })
    console.log(`Room created: ${roomId}`)
  })

  socket.on('join_room', ({ roomId }, callback) => {
    const room = rooms.get(roomId)
    if (!room) { if (callback) callback({ success: false, error: '房间不存在' }); return }
    if (room.players.length >= 2) { if (callback) callback({ success: false, error: '房间已满' }); return }
    room.players.push({ id: socket.id, playerIndex: 2, ready: false })
    socket.join(roomId)
    socket.emit('room_joined', { roomId, playerIndex: 2, state: getPublicState(room.state) })
    io.to(roomId).emit('opponent_joined')
    if (callback) callback({ success: true, roomId })
    console.log(`Player joined room: ${roomId}`)
  })

  socket.on('start_game', () => {
    const room = findRoomByPlayer(socket.id)
    if (!room || room.players.length < 2) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    player.ready = true
    if (room.players.every(p => p.ready)) {
      room.players.forEach(p => p.ready = false)
      io.to(room.id).emit('game_started', { state: getPublicState(room.state) })
    }
  })

  socket.on('select_action', ({ action }) => {
    const room = findRoomByPlayer(socket.id)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    const key = player.playerIndex === 1 ? 'p1' : 'p2'
    const stateKey = player.playerIndex === 1 ? 'p1' : 'p2'
    const cost = getActionCost(action)
    if (cost > 0 && room.state[stateKey].energy < cost) return

    room.state.selected[key] = action
    socket.emit('action_confirmed', { action })

    if (room.state.selected.p1 !== null && room.state.selected.p2 !== null) {
      executeRound(room)
      io.to(room.id).emit('round_result', {
        result: room.state.lastResult,
        state: getPublicState(room.state),
        round: room.state.round,
        p1Action: room.state.selected.p1,
        p2Action: room.state.selected.p2,
      })
    } else {
      socket.broadcast.to(room.id).emit('opponent_selected')
    }
  })

  socket.on('continue_game', () => {
    const room = findRoomByPlayer(socket.id)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    player.ready = true
    if (room.players.every(p => p.ready)) {
      advanceRound(room)
      io.to(room.id).emit('new_round', { state: getPublicState(room.state), round: room.state.round })
      room.players.forEach(p => p.ready = false)
    }
  })

  socket.on('disconnect', () => {
    const room = findRoomByPlayer(socket.id)
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id)
      if (room.players.length === 0) rooms.delete(room.id)
      else io.to(room.id).emit('opponent_disconnected')
    }
    console.log(`Client disconnected: ${socket.id}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`╔══════════════════════════════════╗`)
  console.log(`║     拍拍秀 游戏服务器 🎮         ║`)
  console.log(`╠══════════════════════════════════╣`)
  console.log(`║  Port: ${PORT}`)
  console.log(`║  Mode: ${isProduction ? '🚀 Production' : '🔧 Development'}`)
  if (!isProduction) {
    console.log(`║  Frontend: http://localhost:5173   ║`)
  }
  console.log(`╚══════════════════════════════════╝`)
})
