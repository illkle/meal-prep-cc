import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db'

import { foodItemSchema, recipeIngredientSchema, recipeSchema } from './schema'

const safeStorage =
  typeof window === 'undefined' ? undefined : window.localStorage

const baseOptions = {
  storage: safeStorage,
}

export const foodItemsCollection = createCollection(
  localStorageCollectionOptions({
    ...baseOptions,
    id: 'food-items',
    storageKey: 'meal-prep-food-items',
    getKey: (item) => item.id,
    schema: foodItemSchema,
  }),
)

export const recipesCollection = createCollection(
  localStorageCollectionOptions({
    ...baseOptions,
    id: 'recipes',
    storageKey: 'meal-prep-recipes',
    getKey: (item) => item.id,
    schema: recipeSchema,
  }),
)

export const recipeIngredientsCollection = createCollection(
  localStorageCollectionOptions({
    ...baseOptions,
    id: 'recipe-ingredients',
    storageKey: 'meal-prep-recipe-ingredients',
    getKey: (item) => item.id,
    schema: recipeIngredientSchema,
  }),
)

export const dbCollections = {
  foodItems: foodItemsCollection,
  recipes: recipesCollection,
  recipeIngredients: recipeIngredientsCollection,
}
