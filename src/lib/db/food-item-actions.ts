import { foodItemsCollection, recipeIngredientsCollection } from './schema'
import { macroFieldMap } from './food-macro-fields'
import type { MacroTotals } from './schema'

export function renameFoodItem(
  foodId: string,
  name: string,
  timestamp: number = new Date().getTime(),
) {
  const nextName = name.trim()
  if (!nextName) return

  foodItemsCollection.update(foodId, (draft) => {
    draft.name = nextName
    draft.updatedAt = timestamp
  })
}

export function setFoodPortionWeight(
  foodId: string,
  weight?: number,
  timestamp: number = new Date().getTime(),
) {
  foodItemsCollection.update(foodId, (draft) => {
    draft.portionWeight = Math.max(0, weight ?? 0)
    draft.updatedAt = timestamp
  })
}

export function setFoodMacroValue(
  foodId: string,
  key: keyof MacroTotals,
  value: number,
  timestamp: number = new Date().getTime(),
) {
  const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0
  const targetKey = macroFieldMap[key]

  foodItemsCollection.update(foodId, (draft) => {
    draft[targetKey] = sanitized
    draft.updatedAt = timestamp
  })
}

export function deleteFoodItemCascade(foodId: string) {
  const ingredientIds = Array.from(recipeIngredientsCollection.values())
    .filter((ingredient) => ingredient.foodId === foodId)
    .map((ingredient) => ingredient.id)

  if (ingredientIds.length) {
    recipeIngredientsCollection.delete(ingredientIds)
  }

  foodItemsCollection.delete(foodId)
}
