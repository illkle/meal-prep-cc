import { recipeIngredientsCollection, recipesCollection } from './schema'
import type { Recipe } from './schema'

export function createRecipe(name?: string, timestamp: number = Date.now()): Recipe {
  const trimmedName = name?.trim()

  const recipe: Recipe = {
    id: crypto.randomUUID(),
    name: trimmedName ? trimmedName : 'Untitled Recipe',
    portionsPrepared: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  recipesCollection.insert(recipe)
  return recipe
}

export function renameRecipe(recipeId: string, name: string, timestamp: number = Date.now()) {
  if (!name) return

  recipesCollection.update(recipeId, (draft) => {
    draft.name = name
    draft.updatedAt = timestamp
  })
}

export function setRecipePortionsPrepared(
  recipeId: string,
  portions: number,
  timestamp: number = Date.now(),
) {
  if (!Number.isFinite(portions) || portions <= 0) return

  recipesCollection.update(recipeId, (draft) => {
    draft.portionsPrepared = portions
    draft.updatedAt = timestamp
  })
}

export function deleteRecipeCascade(recipeId: string) {
  const ingredientIds = Array.from(recipeIngredientsCollection.values())
    .filter((ingredient) => ingredient.recipeId === recipeId)
    .map((ingredient) => ingredient.id)

  if (ingredientIds.length) {
    recipeIngredientsCollection.delete(ingredientIds)
  }

  recipesCollection.delete(recipeId)
}
