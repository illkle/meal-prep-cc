import { foodItemsCollection, recipeIngredientsCollection } from './schema'
import { getNextRecipeIngredientSortOrder } from './recipe-ingredient-order'
import type { FoodItem } from './schema'

export function setRecipeIngredientUnits(
  ingredientId: string,
  units: number,
  portionWeight: number,
  timestamp: number = Date.now(),
) {
  if (!Number.isFinite(units) || units <= 0) return
  if (!Number.isFinite(portionWeight) || portionWeight <= 0) return

  recipeIngredientsCollection.update(ingredientId, (draft) => {
    draft.quantityValue = units * portionWeight
    draft.updatedAt = timestamp
  })
}

export function setRecipeIngredientGrams(
  ingredientId: string,
  grams: number,
  timestamp: number = Date.now(),
) {
  if (!Number.isFinite(grams) || grams <= 0) return

  recipeIngredientsCollection.update(ingredientId, (draft) => {
    draft.quantityValue = grams
    draft.updatedAt = timestamp
  })
}

export function deleteRecipeIngredient(ingredientId: string) {
  recipeIngredientsCollection.delete(ingredientId)
}

export function addIngredientToRecipe(
  recipeId: string,
  foodId: string,
  timestamp: number = Date.now(),
) {
  recipeIngredientsCollection.insert({
    id: crypto.randomUUID(),
    recipeId,
    foodId,
    sortOrder: getNextRecipeIngredientSortOrder(recipeId),
    quantityValue: 100,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

export function createFoodAndAddIngredient(
  recipeId: string,
  foodName: string,
  timestamp: number = Date.now(),
) {
  const trimmedName = foodName.trim()
  if (!trimmedName) return

  const foodId = crypto.randomUUID()
  const newFood: FoodItem = {
    id: foodId,
    name: trimmedName,
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  foodItemsCollection.insert(newFood)
  addIngredientToRecipe(recipeId, foodId, timestamp)
}
