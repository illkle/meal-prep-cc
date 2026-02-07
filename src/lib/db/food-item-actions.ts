import { foodItemsCollection } from './collections'
import { macroFieldMap } from './food-macro-fields'
import type { MacroTotals } from './schema'

export function renameFoodItem(foodId: string, name: string) {
  const nextName = name.trim()
  if (!nextName) return

  const now = new Date().toISOString()
  foodItemsCollection.update(foodId, (draft) => {
    draft.name = nextName
    draft.updatedAt = now
  })
}

export function setFoodPortionWeight(foodId: string, weight?: number) {
  const now = new Date().toISOString()
  foodItemsCollection.update(foodId, (draft) => {
    if (weight && weight > 0) {
      draft.portionWeight = weight
    } else {
      delete draft.portionWeight
    }
    draft.updatedAt = now
  })
}

export function setFoodMacroValue(foodId: string, key: keyof MacroTotals, value: number) {
  const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0
  const now = new Date().toISOString()
  const targetKey = macroFieldMap[key]

  foodItemsCollection.update(foodId, (draft) => {
    draft[targetKey] = sanitized
    draft.updatedAt = now
  })
}
