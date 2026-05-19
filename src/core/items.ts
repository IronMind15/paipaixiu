import type { ItemDef } from './types'

export const ITEMS: ItemDef[] = [
  { id: 'tianma', name: '天马', icon: '🐴', desc: '光属性坐骑', element: 'light', damageTier: 1 },
  { id: 'bingjian', name: '冰箭', icon: '🏹', desc: '冰属性远程攻击', element: 'ice', damageTier: 1 },
  { id: 'longzhua', name: '龙爪', icon: '🐉', desc: '龙属性攻击', element: 'dragon', damageTier: 1 },
  { id: 'bagua', name: '八卦', icon: '☯️', desc: '通用法宝', element: 'none', damageTier: 2 },
  { id: 'shuiqiu', name: '水球', icon: '💧', desc: '水属性魔法', element: 'water', damageTier: 2 },
  { id: 'huoqiu', name: '火球', icon: '🔥', desc: '火属性魔法', element: 'fire', damageTier: 2 },
  { id: 'xiaojingang', name: '小金刚拳', icon: '👊', desc: '拳系攻击', element: 'none', damageTier: 3 },
  { id: 'dajingang', name: '大金刚拳', icon: '💥', desc: '强力拳系攻击', element: 'earth', damageTier: 3 },
  { id: 'toukui', name: '头盔', icon: '🪖', desc: '头部装备', element: 'none', damageTier: 3 },
  { id: 'shoukui', name: '手盔', icon: '🧤', desc: '手部装备', element: 'none', damageTier: 3 },
  { id: 'jiaokui', name: '脚盔', icon: '👢', desc: '脚部装备', element: 'none', damageTier: 3 },
]

export function getItemDamage(tier: 1 | 2 | 3): number {
  switch (tier) {
    case 1: return 0.5
    case 2: return 0.75
    case 3: return 1.0
  }
}

export function getItemActionConfig(item: ItemDef): { id: string; icon: string; label: string; desc: string; cost: number; category: 'item' } {
  return {
    id: `item_${item.id}`,
    icon: item.icon,
    label: item.name,
    desc: item.desc,
    cost: 1,
    category: 'item',
  }
}

export function getItemById(id: string): ItemDef | undefined {
  return ITEMS.find(i => i.id === id)
}

export const ITEM_SKILL_MAP: Record<string, { skillId: string; defenseId?: string }> = {
  tianma: { skillId: '天马流星拳', defenseId: '天马防' },
  bingjian: { skillId: '冰天雪地', defenseId: '冰箭防' },
  longzhua: { skillId: '龙爪锁链', defenseId: '龙爪防' },
  bagua: { skillId: '烫水八卦炉' },
}

export const ITEM_NAMES: Record<string, string> = {
  tianma: '天马',
  bingjian: '冰箭',
  longzhua: '龙爪',
  bagua: '八卦',
  shuiqiu: '水球',
  huoqiu: '火球',
  xiaojingang: '小金刚拳',
  dajingang: '大金刚拳',
  toukui: '头盔',
  shoukui: '手盔',
  jiaokui: '脚盔',
}
