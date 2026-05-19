import type { RoundResult, PlayerState } from './types'
import { BASIC_ACTIONS, SPECIAL_SKILLS, DEFENSE_SKILLS, ENERGY_MAX, ITEM_ACTION_COST } from './constants'
import { getItemDamage, getItemById, ITEM_NAMES } from './items'

export function getActionCost(action: string): number {
  const basic = BASIC_ACTIONS.find(a => a.id === action)
  if (basic) return basic.cost
  const skill = SPECIAL_SKILLS.find(a => a.id === action)
  if (skill) return skill.cost
  const defs = DEFENSE_SKILLS.find(a => a.id === action)
  if (defs) return defs.cost
  if (action.startsWith('item_')) return ITEM_ACTION_COST
  return 0
}

function isItemAction(a: string): boolean {
  return a.startsWith('item_')
}

function isSkill(a: string): boolean {
  return SPECIAL_SKILLS.some(x => x.id === a)
}

function isDefense(a: string): boolean {
  return DEFENSE_SKILLS.some(x => x.id === a)
}

function isAttack(a: string): boolean {
  return a === '波' || a === '六克' || a === '龟派气功波' || isItemAction(a) || isSkill(a)
}

function isDefend(a: string): boolean {
  return a === '防' || a === '大防' || isDefense(a)
}

function getItemIdFromAction(action: string): string | null {
  if (action.startsWith('item_')) return action.slice(5)
  return null
}

function getItemDamageFromAction(action: string): number {
  const itemId = getItemIdFromAction(action)
  if (!itemId) return 0
  const item = getItemById(itemId)
  if (!item) return 0
  return getItemDamage(item.damageTier)
}

function getSkillDamage(_action: string): number {
  return 1.0
}

function getItemDisplayName(action: string): string {
  const itemId = getItemIdFromAction(action)
  if (itemId && ITEM_NAMES[itemId]) return ITEM_NAMES[itemId]
  return action
}

export function resolveRound(
  a1: string,
  a2: string,
): RoundResult {
  let p1Damage = 0
  let p2Damage = 0
  let p1EnergyGain = 0
  let p2EnergyGain = 0
  let message = ''
  let msgSet = false

  const p1Cost = getActionCost(a1)
  const p2Cost = getActionCost(a2)
  const p1Name = isItemAction(a1) ? getItemDisplayName(a1) : a1
  const p2Name = isItemAction(a2) ? getItemDisplayName(a2) : a2

  if (a1 === '秀') p1EnergyGain = 1
  if (a2 === '秀') p2EnergyGain = 1

  const p1IsAttack = isAttack(a1)
  const p2IsAttack = isAttack(a2)
  const p1IsDefend = isDefend(a1)
  const p2IsDefend = isDefend(a2)

  // ====== Same actions cancel ======
  if (a1 === a2) {
    message = getCancelMessage(a1, p1Name)
    return { p1Damage, p2Damage, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost, message, p1Action: a1, p2Action: a2 }
  }

  // ====== 秀 gets attacked ======
  if (a1 === '秀' && p2IsAttack) {
    p1Damage = 1.0
    message = `玩家1在积攒能量时被「${p2Name}」击中，直接判负 💀`
    return { p1Damage, p2Damage, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost, message, p1Action: a1, p2Action: a2 }
  }
  if (a2 === '秀' && p1IsAttack) {
    p2Damage = 1.0
    message = `玩家2在积攒能量时被「${p1Name}」击中，直接判负 💀`
    return { p1Damage, p2Damage, p1EnergyGain, p2EnergyGain, p1EnergyCost: p1Cost, p2EnergyCost: p2Cost, message, p1Action: a1, p2Action: a2 }
  }

  // ====== 秀 vs 防/大防/defense skills ======
  if (a1 === '秀' && (a2 === '防' || a2 === '大防' || isDefense(a2))) {
    message = `玩家1成功积攒了能量 ⚡`
    msgSet = true
  }
  if (a2 === '秀' && (a1 === '防' || a1 === '大防' || isDefense(a1))) {
    message = `玩家2成功积攒了能量 ⚡`
    msgSet = true
  }

  // ====== Both defend → nothing ======
  if (p1IsDefend && p2IsDefend && !msgSet) {
    message = '双方都采取了防御姿态 🛡️'
    msgSet = true
  }

  // ====== Attack vs Attack ======
  if (p1IsAttack && p2IsAttack && !msgSet) {
    const dmg = resolveAttackVsAttack(a1, a2, p1Name, p2Name)
    p1Damage = dmg.p1Damage
    p2Damage = dmg.p2Damage
    message = dmg.message
    msgSet = true
  }

  // ====== Attack vs Defend ======
  if (p1IsAttack && p2IsDefend && !msgSet) {
    const dmg = resolveAttackVsDefend(a1, a2, p1Name, p2Name)
    p1Damage = dmg.attackerDamage
    message = dmg.message
    msgSet = true
  }
  if (p2IsAttack && p1IsDefend && !msgSet) {
    const dmg = resolveAttackVsDefend(a2, a1, p2Name, p1Name)
    p2Damage = dmg.attackerDamage
    message = dmg.message
    msgSet = true
  }

  // ====== Defend vs Attack (other way) - already handled above ======
  if (!msgSet) {
    if (a1 === '秀' && (a2 === '防' || a2 === '大防' || isDefense(a2))) {
      message = '玩家1成功积攒了能量 ⚡'
    } else if (a2 === '秀' && (a1 === '防' || a1 === '大防' || isDefense(a1))) {
      message = '玩家2成功积攒了能量 ⚡'
    } else if ((a1 === '防' && a2 === '大防') || (a1 === '大防' && a2 === '防')) {
      message = '双方都采取了防御姿态 🛡️'
    } else if ((isDefense(a1) && a2 === '防') || (a1 === '防' && isDefense(a2)) ||
               (isDefense(a1) && a2 === '大防') || (a1 === '大防' && isDefense(a2)) ||
               (isDefense(a1) && isDefense(a2))) {
      message = '双方都采取了防御姿态 🛡️'
    } else {
      message = `${p1Name} VS ${p2Name}，互相抵消 💫`
    }
  }

  return {
    p1Damage, p2Damage, p1EnergyGain, p2EnergyGain,
    p1EnergyCost: p1Cost, p2EnergyCost: p2Cost,
    message, p1Action: a1, p2Action: a2,
  }
}

function getCancelMessage(action: string, displayName: string): string {
  if (action === '秀') return '双方都积攒了能量 ⚡'
  if (action === '防') return '双方都采取了防御态势 🛡️'
  if (action === '大防') return '双方都架起了大防 🏰'
  if (action === '波') return '双方能量波相互抵消 💫'
  if (action === '六克') return '双方六克激烈碰撞，相互抵消 💥'
  if (action === '龟派气功波') return '双方龟派气功波猛烈对撞，天地变色 🌪️'
  if (isSkill(action)) return `双方${displayName}激烈碰撞，相互抵消 🌪️`
  if (isItemAction(action)) return `双方${displayName}相互抵消 💫`
  return `双方${displayName}相互抵消 💫`
}

function resolveAttackVsAttack(a1: string, a2: string, n1: string, n2: string): { p1Damage: number; p2Damage: number; message: string } {
  let p1Damage = 0, p2Damage = 0, message = ''

  const a1Dmg = getAttackDamage(a1)
  const a2Dmg = getAttackDamage(a2)

  if (a1Dmg > a2Dmg) {
    p2Damage = a1Dmg
    message = `「${n1}」 overpower 「${n2}」，玩家2受到${a1Dmg}点伤害 💥`
  } else if (a2Dmg > a1Dmg) {
    p1Damage = a2Dmg
    message = `「${n2}」 overpower 「${n1}」，玩家1受到${a2Dmg}点伤害 💥`
  } else {
    message = `「${n1}」和「${n2}」相互抵消 💫`
  }

  return { p1Damage, p2Damage, message }
}

function getAttackDamage(action: string): number {
  if (action === '波') return 0.5
  if (action === '六克') return 1.0
  if (action === '龟派气功波') return 1.0
  if (isSkill(action)) return getSkillDamage(action)
  if (isItemAction(action)) return getItemDamageFromAction(action)
  return 0
}

function resolveAttackVsDefend(attack: string, defend: string, attackName: string, defendName: string): { attackerDamage: number; message: string } {
  let attackerDamage = 0
  let message = ''

  const atkDmg = getAttackDamage(attack)

  if (defend === '防') {
    if (attack === '波') {
      message = `「${defendName}」完全挡住了「${attackName}」🛡️`
    } else if (attack === '六克') {
      attackerDamage = 0.5
      message = `「${defendName}」勉强挡住「${attackName}」，受到0.5伤害 💢`
    } else if (attack === '龟派气功波') {
      attackerDamage = 1.0
      message = `「龟派气功波」击穿了「${defendName}」！直接判负 ☠️`
    } else if (isSkill(attack)) {
      attackerDamage = 1.0
      message = `「${attackName}」击穿了「${defendName}」！直接判负 ☠️`
    } else if (isItemAction(attack)) {
      const itemId = getItemIdFromAction(attack)
      const item = itemId ? getItemById(itemId) : null
      if (item && item.damageTier === 1) {
        message = `「${defendName}」完全挡住了「${attackName}」🛡️`
      } else if (item && item.damageTier === 2) {
        attackerDamage = 0.375
        message = `「${defendName}」勉强挡住「${attackName}」，受到0.375伤害 💢`
      } else {
        attackerDamage = 1.0
        message = `「${attackName}」击穿了「${defendName}」！直接判负 ☠️`
      }
    }
  } else if (defend === '大防') {
    if (attack === '波') {
      attackerDamage = 0.5
      message = `「波」击中了「大防」，受到0.5伤害 🌊`
    } else if (attack === '六克') {
      attackerDamage = 1.0
      message = `「六克」贯穿了「大防」！直接判负 💀`
    } else if (attack === '龟派气功波') {
      message = `「大防」完美挡住了「龟派气功波」🏰✨`
    } else if (isSkill(attack)) {
      message = `「大防」完美挡住了「${attackName}」🏰✨`
    } else if (isItemAction(attack)) {
      const itemId = getItemIdFromAction(attack)
      const item = itemId ? getItemById(itemId) : null
      if (item && item.damageTier === 3) {
        attackerDamage = 0.5
        message = `「${attackName}」击中了「大防」，受到0.5伤害 🌊`
      } else {
        message = `「大防」完全挡住了「${attackName}」🏰`
      }
    }
  } else if (isDefense(defend)) {
    if (attack === '波' || (isItemAction(attack) && (getItemById(getItemIdFromAction(attack)!)?.damageTier ?? 3) <= 2)) {
      message = `「${defendName}」完全挡住了「${attackName}」🛡️`
    } else {
      attackerDamage = atkDmg
      message = `「${attackName}」击穿了「${defendName}」，受到${atkDmg}点伤害 ☠️`
    }
  }

  return { attackerDamage, message }
}

export function createInitialPlayer(): PlayerState {
  return {
    hp: 1.0,
    maxHp: 1.0,
    energy: 0,
    maxEnergy: ENERGY_MAX,
    items: [],
    selected: null,
    alive: true,
    consecutiveBo: 0,
    kamehamehaUnlocked: false,
    unlockedSkills: [],
    unlockedDefenses: [],
    itemActionCount: {},
    lastItemAction: null,
  }
}
