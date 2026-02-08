import { useMemo } from 'react'

import { eq, useLiveQuery } from '@tanstack/react-db'

import { calculateIngredientMacros, perPortionMacros, sumMacros } from './calculations'
import { emptyMacroTotals, type FoodItem, type MacroTotals, type RecipeIngredient } from './schema'

import { foodItemsCollection, recipeIngredientsCollection, recipesCollection } from './collections'

export function useFoodItems() {
  return useLiveQuery((q) => q.from({ food: foodItemsCollection }).orderBy(({ food }) => food.name))
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
  return useLiveQuery((q) =>
    q.from({ recipe: recipesCollection }).orderBy(({ recipe }) => recipe.name),
  )
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

type FoodInRecipe = {
  ingredient: RecipeIngredient
  food: FoodItem
}

type RecipeNutrition = {
  totals: MacroTotals
  perPortion: MacroTotals
}

export function useRecipeNutrition(
  foodsInRecipe: Array<FoodInRecipe> | undefined,
  portions: number,
): RecipeNutrition {
  return useMemo(() => {
    if (!foodsInRecipe) {
      return {
        totals: emptyMacroTotals,
        perPortion: emptyMacroTotals,
      }
    }

    const totals = sumMacros(
      foodsInRecipe.map(({ ingredient, food }) => calculateIngredientMacros(ingredient, food)),
    )

    return {
      totals,
      perPortion: perPortionMacros(totals, portions > 0 ? portions : 1),
    }
  }, [foodsInRecipe, portions])
}
