import { useMemo } from 'react'

import { eq, useLiveQuery } from '@tanstack/react-db'

import {
  foodItemsCollection,
  recipeIngredientsCollection,
  recipesCollection,
} from './collections'
import {
  calculateIngredientMacros,
  perPortionMacros,
  sumMacros,
} from './calculations'

export function useFoodItems() {
  return useLiveQuery(() => foodItemsCollection)
}

export function useRecipes() {
  return useLiveQuery(() => recipesCollection)
}

export function useRecipe(recipeId?: string) {
  return useLiveQuery(
    (q) =>
      recipeId
        ? q
            .from({ recipe: recipesCollection })
            .where(({ recipe }) => eq(recipe.id, recipeId))
            .select(({ recipe }) => recipe)
            .findOne()
        : undefined,
    [recipeId],
  )
}

export function useRecipeIngredients(recipeId?: string) {
  return useLiveQuery(
    (q) =>
      recipeId
        ? q
            .from({ ingredient: recipeIngredientsCollection })
            .where(({ ingredient }) => eq(ingredient.recipeId, recipeId))
            .select(({ ingredient }) => ingredient)
        : undefined,
    [recipeId],
  )
}

export function useRecipeNutrition(recipeId?: string) {
  const recipeQuery = useRecipe(recipeId)

  const joinedQuery = useLiveQuery(
    (q) =>
      recipeId
        ? q
            .from({ ingredient: recipeIngredientsCollection })
            .innerJoin({ food: foodItemsCollection }, ({ ingredient, food }) =>
              eq(ingredient.foodId, food.id),
            )
            .where(({ ingredient }) => eq(ingredient.recipeId, recipeId))
            .select(({ ingredient, food }) => ({ ingredient, food }))
        : undefined,
    [recipeId],
  )

  const nutrition = useMemo(() => {
    if (!joinedQuery.data) {
      return undefined
    }

    const totals = sumMacros(
      joinedQuery.data.map(({ ingredient, food }) =>
        calculateIngredientMacros(ingredient, food),
      ),
    )

    const perPortion = recipeQuery.data
      ? perPortionMacros(totals, recipeQuery.data.portionsPrepared)
      : undefined

    return {
      totals,
      perPortion,
    }
  }, [joinedQuery.data, recipeQuery.data])

  return {
    ...joinedQuery,
    recipe: recipeQuery.data,
    nutrition,
  }
}
