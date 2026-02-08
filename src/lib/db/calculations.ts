import type { FoodItem, MacroTotals, RecipeIngredient } from './schema'

export const macroKeys: Array<keyof MacroTotals> = [
  'calories',
  'protein',
  'carbs',
  'fat',
]

export function gramsForIngredient(
  ingredient: RecipeIngredient,
): number {
  return ingredient.quantityValue
}

export function calculateIngredientMacros(
  ingredient: RecipeIngredient,
  food: FoodItem,
): MacroTotals {
  const grams = gramsForIngredient(ingredient)
  const factor = grams / 100

  return {
    calories: roundMacro(food.caloriesPer100g * factor),
    protein: roundMacro(food.proteinPer100g * factor),
    carbs: roundMacro(food.carbsPer100g * factor),
    fat: roundMacro(food.fatPer100g * factor),
  }
}

export function sumMacros(items: Array<MacroTotals>): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function perPortionMacros(
  totals: MacroTotals,
  portions: number,
): MacroTotals {
  if (!portions || portions <= 0) {
    return { ...totals }
  }

  return {
    calories: roundMacro(totals.calories / portions),
    protein: roundMacro(totals.protein / portions),
    carbs: roundMacro(totals.carbs / portions),
    fat: roundMacro(totals.fat / portions),
  }
}

const roundMacro = (value: number) => Math.round(value * 100) / 100
