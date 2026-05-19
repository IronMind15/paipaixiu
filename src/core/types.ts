export type ActionType = string

export type ElementType =
  | 'none'
  | 'fire'
  | 'water'
  | 'ice'
  | 'wind'
  | 'earth'
  | 'dragon'
  | 'light'
  | 'dark'

export interface ActionConfig {
  id: string
  icon: string
  label: string
  desc: string
  cost: number
  category: 'basic' | 'item' | 'skill' | 'defense'
}

export interface ItemDef {
  id: string
  name: string
  icon: string
  desc: string
  element: ElementType
  damageTier: 1 | 2 | 3
}

export interface SpecialSkill {
  id: string
  name: string
  icon: string
  desc: string
  cost: number
  damage: number
  unlockItem: string
  isDefense?: boolean
}

export interface PlayerState {
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  items: ItemDef[]
  selected: string | null
  alive: boolean
  consecutiveBo: number
  kamehamehaUnlocked: boolean
  unlockedSkills: string[]
  unlockedDefenses: string[]
  itemActionCount: Record<string, number>
  lastItemAction: string | null
}

export interface RoundResult {
  p1Damage: number
  p2Damage: number
  p1EnergyGain: number
  p2EnergyGain: number
  p1EnergyCost: number
  p2EnergyCost: number
  message: string
  p1Action: string
  p2Action: string
}

export type Phase = 'basic' | 'advanced'
export type GameStatus = 'playing' | 'roundEnd' | 'gameOver'

export interface GameState {
  p1: PlayerState
  p2: PlayerState
  round: number
  phase: Phase
  status: GameStatus
  lastResult: RoundResult | null
  winner: 1 | 2 | 0 | null
  itemIndex: number
  roundWinner: 1 | 2 | 0 | null
}
