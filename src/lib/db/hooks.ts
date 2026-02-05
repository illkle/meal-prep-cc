import { useMemo } from 'react'

import { eq, useLiveQuery } from '@tanstack/react-db'

import { foodItemsCollection, recipeIngredientsCollection, recipesCollection } from './collections'
import { calculateIngredientMacros, sumMacros } from './calculations'

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

export function useRecipeNutrition(recipeId: string) {
  const recipeQuery = useRecipe(recipeId)
  const foodsInRecipeQuery = useFoodsInRecipe(recipeId)

  const nutrition = useMemo(() => {
    if (!foodsInRecipeQuery.data) {
      return undefined
    }

    const totals = sumMacros(
      foodsInRecipeQuery.data.map(({ ingredient, food }) =>
        calculateIngredientMacros(ingredient, food),
      ),
    )

    return {
      totals,
    }
  }, [foodsInRecipeQuery.data])

  return {
    foodsInRecipeQuery,
    recipeQuery,
    nutrition,
  }
}
