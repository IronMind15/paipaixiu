import type { ActionConfig } from './types'

export const ENERGY_MAX = 6
export const BASE_HP = 1.0
export const BASE_MAX_HP = 1.0
export const KAME_UNLOCK_CONSECUTIVE = 3
export const KAME_UNLOCK_ENERGY = 4
export const KAME_COST = 2
export const ITEM_ACTION_COST = 1
export const SKILL_COST = 2
export const UNLOCK_CONSECUTIVE = 3

export const BASIC_ACTIONS: ActionConfig[] = [
  { id: '秀', icon: '✨', label: '秀', desc: '积攒能量', cost: 0, category: 'basic' },
  { id: '防', icon: '🛡️', label: '防', desc: '基础防御', cost: 0, category: 'basic' },
  { id: '波', icon: '🌊', label: '波', desc: '基础攻击', cost: 1, category: 'basic' },
  { id: '六克', icon: '💢', label: '六克', desc: '强力攻击', cost: 2, category: 'basic' },
  { id: '大防', icon: '🏰', label: '大防', desc: '终极防御', cost: 0, category: 'basic' },
  { id: '龟派气功波', icon: '🌀', label: '龟派气功波', desc: '波之大招', cost: 2, category: 'skill' },
]

export const SPECIAL_SKILLS: ActionConfig[] = [
  { id: '天马流星拳', icon: '🌠', label: '天马流星拳', desc: '天马大招', cost: 2, category: 'skill' },
  { id: '冰天雪地', icon: '❄️', label: '冰天雪地', desc: '冰箭大招', cost: 2, category: 'skill' },
  { id: '龙爪锁链', icon: '⛓️', label: '龙爪锁链', desc: '龙爪大招', cost: 2, category: 'skill' },
  { id: '烫水八卦炉', icon: '♨️', label: '烫水八卦炉', desc: '八卦大招', cost: 2, category: 'skill' },
  { id: '烈焰龙爪', icon: '🔥🐉', label: '烈焰龙爪', desc: '龙爪+八卦组合技', cost: 2, category: 'skill' },
]

export const DEFENSE_SKILLS: ActionConfig[] = [
  { id: '天马防', icon: '🐴🛡️', label: '天马防', desc: '天马防御', cost: 0, category: 'defense' },
  { id: '冰箭防', icon: '🏹🛡️', label: '冰箭防', desc: '冰箭防御', cost: 0, category: 'defense' },
  { id: '龙爪防', icon: '🐉🛡️', label: '龙爪防', desc: '龙爪防御', cost: 0, category: 'defense' },
]

export const PHASE_LABELS: Record<string, string> = {
  basic: '基础阶段',
  advanced: '进阶阶段',
}
