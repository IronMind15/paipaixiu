import { reactive, computed } from 'vue'
import type { GameState, PlayerState } from '../core/types'
import { createInitialPlayer, resolveRound, getActionCost } from '../core/engine'
import { ENERGY_MAX, UNLOCK_CONSECUTIVE, KAME_UNLOCK_CONSECUTIVE } from '../core/constants'
import { ITEMS, ITEM_SKILL_MAP } from '../core/items'
import { SPECIAL_SKILLS, DEFENSE_SKILLS } from '../core/constants'

function createInitialState(): GameState {
  return {
    p1: createInitialPlayer(),
    p2: createInitialPlayer(),
    round: 1,
    phase: 'basic',
    status: 'playing',
    lastResult: null,
    winner: null,
    itemIndex: 0,
    roundWinner: null,
  }
}

const state = reactive<GameState>(createInitialState())

export function useGameState() {
  const isPlaying = computed(() => state.status === 'playing')
  const isRoundEnd = computed(() => state.status === 'roundEnd')
  const isGameOver = computed(() => state.status === 'gameOver')
  const bothSelected = computed(() => state.p1.selected !== null && state.p2.selected !== null)

  const hasDamage = computed(() => {
    const r = state.lastResult
    if (!r) return false
    return r.p1Damage > 0 || r.p2Damage > 0
  })

  const hasDeath = computed(() => {
    return !state.p1.alive || !state.p2.alive
  })

  const firstCondition = computed(() => isPlaying.value && !state.p1.selected && !state.p2.selected)
  const secondCondition = computed(() => isPlaying.value && (state.p1.selected || state.p2.selected))
  const showBattle = computed(() => isRoundEnd.value && state.lastResult !== null)

  function isKamehamehaAvailable(player: 1 | 2): boolean {
    const p = player === 1 ? state.p1 : state.p2
    return p.kamehamehaUnlocked || p.energy >= 4
  }

  function getPlayerActions(player: 1 | 2): { id: string; icon: string; label: string; cost: number }[] {
    const p = player === 1 ? state.p1 : state.p2
    const actions: { id: string; icon: string; label: string; cost: number }[] = []

    actions.push(
      { id: '秀', icon: '✨', label: '秀', cost: 0 },
      { id: '防', icon: '🛡️', label: '防', cost: 0 },
      { id: '波', icon: '🌊', label: '波', cost: 1 },
      { id: '六克', icon: '💢', label: '六克', cost: 2 },
      { id: '大防', icon: '🏰', label: '大防', cost: 0 },
    )

    if (isKamehamehaAvailable(player)) {
      actions.push({ id: '龟派气功波', icon: '🌀', label: '龟派气功波', cost: 2 })
    }

    for (const item of p.items) {
      actions.push({ id: `item_${item.id}`, icon: item.icon, label: item.name, cost: 1 })
    }

    for (const skillId of p.unlockedSkills) {
      const cfg = SPECIAL_SKILLS.find(s => s.id === skillId)
      if (cfg) {
        actions.push({ id: cfg.id, icon: cfg.icon, label: cfg.label, cost: cfg.cost })
      }
    }

    for (const defId of p.unlockedDefenses) {
      const cfg = DEFENSE_SKILLS.find(d => d.id === defId)
      if (cfg) {
        actions.push({ id: cfg.id, icon: cfg.icon, label: cfg.label, cost: cfg.cost })
      }
    }

    return actions
  }

  function selectAction(player: 1 | 2, action: string) {
    if (state.status !== 'playing') return
    const p = player === 1 ? state.p1 : state.p2
    const cost = getActionCost(action)
    if (cost > 0 && p.energy < cost) return
    p.selected = action
    if (state.p1.selected !== null && state.p2.selected !== null) {
      executeBattle()
    }
  }

  function updateActionTracking(p: PlayerState, usedAction: string) {
    if (usedAction === '波') {
      p.consecutiveBo++
      if (p.consecutiveBo >= KAME_UNLOCK_CONSECUTIVE && !p.kamehamehaUnlocked) {
        p.kamehamehaUnlocked = true
      }
    } else if (usedAction === '龟派气功波') {
    } else {
      p.consecutiveBo = 0
    }

    if (usedAction.startsWith('item_')) {
      const itemId = usedAction.slice(5)
      if (p.lastItemAction === itemId) {
        p.itemActionCount[itemId] = (p.itemActionCount[itemId] || 1) + 1
      } else {
        p.itemActionCount = {}
        p.itemActionCount[itemId] = 1
      }
      p.lastItemAction = itemId

      const unlockInfo = ITEM_SKILL_MAP[itemId]
      if (unlockInfo && p.itemActionCount[itemId] >= UNLOCK_CONSECUTIVE) {
        if (!p.unlockedSkills.includes(unlockInfo.skillId)) {
          p.unlockedSkills.push(unlockInfo.skillId)
        }
        if (unlockInfo.defenseId && !p.unlockedDefenses.includes(unlockInfo.defenseId)) {
          p.unlockedDefenses.push(unlockInfo.defenseId)
        }
      }
    } else if (usedAction.startsWith('item_') === false) {
      p.itemActionCount = {}
      p.lastItemAction = null
    }
  }

  function checkCrossCombo(a1: string, a2: string) {
    const getItemId = (a: string) => a.startsWith('item_') ? a.slice(5) : null
    const id1 = getItemId(a1)
    const id2 = getItemId(a2)

    if ((id1 === 'longzhua' && id2 === 'bagua') || (id1 === 'bagua' && id2 === 'longzhua')) {
      const longzhuaUser = id1 === 'longzhua' ? state.p1 : state.p2
      if (!longzhuaUser.unlockedSkills.includes('烈焰龙爪')) {
        longzhuaUser.unlockedSkills.push('烈焰龙爪')
      }
    }
  }

  function executeBattle() {
    const a1 = state.p1.selected!
    const a2 = state.p2.selected!

    updateActionTracking(state.p1, a1)
    updateActionTracking(state.p2, a2)
    checkCrossCombo(a1, a2)

    const result = resolveRound(a1, a2)

    state.p1.energy = Math.min(ENERGY_MAX, state.p1.energy + result.p1EnergyGain)
    state.p2.energy = Math.min(ENERGY_MAX, state.p2.energy + result.p2EnergyGain)

    state.p1.energy = Math.max(0, state.p1.energy - result.p1EnergyCost)
    state.p2.energy = Math.max(0, state.p2.energy - result.p2EnergyCost)

    state.p1.hp = Math.max(0, state.p1.hp - result.p1Damage)
    state.p2.hp = Math.max(0, state.p2.hp - result.p2Damage)
    state.p1.alive = state.p1.hp > 0
    state.p2.alive = state.p2.hp > 0

    determineRoundWinner(result)

    state.lastResult = result
    state.status = 'roundEnd'
  }

  function determineRoundWinner(result: { p1Damage: number; p2Damage: number }) {
    if (!state.p1.alive && !state.p2.alive) {
      state.roundWinner = 0
    } else if (!state.p1.alive) {
      state.roundWinner = 2
    } else if (!state.p2.alive) {
      state.roundWinner = 1
    } else if (result.p1Damage > 0 && result.p2Damage === 0) {
      state.roundWinner = 2
    } else if (result.p2Damage > 0 && result.p1Damage === 0) {
      state.roundWinner = 1
    } else if (result.p1Damage > 0 && result.p2Damage > 0) {
      if (result.p1Damage > result.p2Damage) {
        state.roundWinner = 2
      } else if (result.p2Damage > result.p1Damage) {
        state.roundWinner = 1
      } else {
        state.roundWinner = 0
      }
    } else {
      state.roundWinner = null
    }
  }

  function continueGame() {
    awardItem()
    const p1Died = state.p1.hp <= 0
    const p2Died = state.p2.hp <= 0
    if (p1Died || p2Died) {
      state.p1.energy = 0
      state.p2.energy = 0
    }
    advanceRound()
  }

  function advanceRound() {
    state.p1.selected = null
    state.p2.selected = null
    state.lastResult = null
    state.roundWinner = null
    state.p1.hp = 1.0
    state.p2.hp = 1.0
    state.p1.alive = true
    state.p2.alive = true
    state.round++
    state.status = 'playing'
  }

  function awardItem() {
    if (state.phase === 'basic' && state.roundWinner !== null && state.roundWinner !== 0 && state.itemIndex < ITEMS.length) {
      if (state.roundWinner === 1) {
        state.p1.items.push({ ...ITEMS[state.itemIndex] })
      } else {
        state.p2.items.push({ ...ITEMS[state.itemIndex] })
      }
      state.itemIndex++
    }

    if (state.itemIndex >= ITEMS.length && state.phase === 'basic') {
      state.phase = 'advanced'
    }
  }

  function restartGame() {
    Object.assign(state, createInitialState())
  }

  function getPlayer(player: 1 | 2): PlayerState {
    return player === 1 ? state.p1 : state.p2
  }

  return {
    state,
    isPlaying,
    isRoundEnd,
    isGameOver,
    bothSelected,
    hasDamage,
    hasDeath,
    firstCondition,
    secondCondition,
    showBattle,
    isKamehamehaAvailable,
    getPlayerActions,
    selectAction,
    continueGame,
    restartGame,
    getPlayer,
  }
}
