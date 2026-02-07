import type { FoodItem, MacroTotals } from './schema'

export type MacroFieldKey =
  | 'caloriesPer100g'
  | 'proteinPer100g'
  | 'carbsPer100g'
  | 'fatPer100g'

export const macroFieldMap: Record<keyof MacroTotals, MacroFieldKey> = {
  calories: 'caloriesPer100g',
  protein: 'proteinPer100g',
  carbs: 'carbsPer100g',
  fat: 'fatPer100g',
}

export function getFoodMacroValue(food: FoodItem, key: keyof MacroTotals): number {
  return food[macroFieldMap[key]]
}
