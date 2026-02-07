import { eq, useLiveQuery } from '@tanstack/react-db'

import { foodItemsCollection, recipeIngredientsCollection, recipesCollection } from './collections'

export function useFoodItems() {
  return useLiveQuery(() => foodItemsCollection)
}

export function useFood(foodId: string) {
  return useLiveQuery((q) =>
    q
      .from({ food: foodItemsCollection })
      .where(({ food }) => eq(food.id, foodId))
      .findOne(),
  )
}

export function useRecipes() {
  return useLiveQuery(() => recipesCollection)
}

export function useRecipe(recipeId: string) {
  return useLiveQuery((q) =>
    q
      .from({ recipe: recipesCollection })
      .where(({ recipe }) => eq(recipe.id, recipeId))
      .findOne(),
  )
}

export function useRecipeIngredients(recipeId: string) {
  return useLiveQuery((q) =>
    q
      .from({ ingredient: recipeIngredientsCollection })
      .where(({ ingredient }) => eq(ingredient.recipeId, recipeId)),
  )
}

export function useFoodsInRecipe(recipeId: string) {
  return useLiveQuery((q) =>
    q
      .from({ ingredient: recipeIngredientsCollection })
      .innerJoin({ food: foodItemsCollection }, ({ ingredient, food }) =>
        eq(ingredient.foodId, food.id),
      )
      .where(({ ingredient }) => eq(ingredient.recipeId, recipeId))
      .select(({ ingredient, food }) => ({ ingredient, food })),
  )
}
