import { z } from 'zod'

const timeStampSchema = z.string().min(1)

export const foodItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  portionWeight: z.number().positive().optional(),
  notes: z.string().optional(),
  createdAt: timeStampSchema,
  updatedAt: timeStampSchema,
})

export const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  portionsPrepared: z.number().positive(),
  notes: z.string().optional(),
  createdAt: timeStampSchema,
  updatedAt: timeStampSchema,
})

export const recipeIngredientSchema = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
  foodId: z.string().min(1),
  quantityType: z.enum(['grams', 'portions']),
  quantityValue: z.number().positive(),
  createdAt: timeStampSchema,
  updatedAt: timeStampSchema,
})

export type FoodItem = z.infer<typeof foodItemSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>

export type MacroTotals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const emptyMacroTotals: MacroTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}
