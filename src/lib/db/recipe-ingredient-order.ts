import { recipeIngredientsCollection } from './schema'
import type { RecipeIngredient } from './schema'

const RESEQUENCE_INTERVAL = 20

const reorderCounters = new Map<string, number>()

const parseTimestamp = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    return new Date(value).getTime()
  }
  return 0
}

const compareRecipeIngredientOrder = (a: RecipeIngredient, b: RecipeIngredient) => {
  const aOrder = Number.isFinite(a.sortOrder) ? (a.sortOrder as number) : null
  const bOrder = Number.isFinite(b.sortOrder) ? (b.sortOrder as number) : null

  if (aOrder !== null && bOrder !== null && aOrder !== bOrder) {
    return aOrder - bOrder
  }

  if (aOrder !== null && bOrder === null) {
    return -1
  }

  if (aOrder === null && bOrder !== null) {
    return 1
  }

  const createdAtDiff = parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt)
  if (createdAtDiff !== 0) {
    return createdAtDiff
  }

  return a.id.localeCompare(b.id)
}

const getRecipeIngredients = (recipeId: string): Array<RecipeIngredient> =>
  Array.from(recipeIngredientsCollection.values()).filter(
    (ingredient) => ingredient.recipeId === recipeId,
  )

const hasOrderAnomalies = (ingredients: Array<RecipeIngredient>) => {
  const seen = new Set<number>()

  for (const ingredient of ingredients) {
    const sortOrder = ingredient.sortOrder

    if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return true
    }

    if (seen.has(sortOrder)) {
      return true
    }

    seen.add(sortOrder)
  }

  return false
}

const getOrderedIngredients = (recipeId: string): Array<RecipeIngredient> =>
  getRecipeIngredients(recipeId).sort(compareRecipeIngredientOrder)

export function sortRecipeIngredientsForDisplay(
  ingredients: Array<RecipeIngredient>,
): Array<RecipeIngredient> {
  return [...ingredients].sort(compareRecipeIngredientOrder)
}

export function resequenceRecipeIngredients(recipeId: string) {
  const ordered = getOrderedIngredients(recipeId)
  if (!ordered.length) {
    reorderCounters.set(recipeId, 0)
    return
  }

  const now = new Date().getTime()

  ordered.forEach((ingredient, index) => {
    if (ingredient.sortOrder === index) {
      return
    }

    recipeIngredientsCollection.update(ingredient.id, (draft) => {
      draft.sortOrder = index
      draft.updatedAt = now
    })
  })

  reorderCounters.set(recipeId, 0)
}

export function maybeResequenceRecipeIngredients(recipeId: string) {
  const ingredients = getRecipeIngredients(recipeId)
  if (!ingredients.length) {
    reorderCounters.set(recipeId, 0)
    return
  }

  if (hasOrderAnomalies(ingredients)) {
    resequenceRecipeIngredients(recipeId)
    return
  }

  const nextCount = (reorderCounters.get(recipeId) ?? 0) + 1
  if (nextCount >= RESEQUENCE_INTERVAL) {
    resequenceRecipeIngredients(recipeId)
    return
  }

  reorderCounters.set(recipeId, nextCount)
}

export function getNextRecipeIngredientSortOrder(recipeId: string): number {
  const ingredients = getRecipeIngredients(recipeId)

  if (!ingredients.length) {
    return 0
  }

  if (hasOrderAnomalies(ingredients)) {
    resequenceRecipeIngredients(recipeId)
  }

  return getOrderedIngredients(recipeId).length
}

export function moveRecipeIngredient(
  recipeId: string,
  ingredientId: string,
  direction: 'up' | 'down',
) {
  if (hasOrderAnomalies(getRecipeIngredients(recipeId))) {
    resequenceRecipeIngredients(recipeId)
  }

  const ordered = getOrderedIngredients(recipeId)
  const currentIndex = ordered.findIndex((ingredient) => ingredient.id === ingredientId)

  if (currentIndex < 0) {
    return
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= ordered.length) {
    return
  }

  const current = ordered[currentIndex]
  const target = ordered[targetIndex]

  const now = new Date().getTime()
  const currentSortOrder = current.sortOrder ?? currentIndex
  const targetSortOrder = target.sortOrder ?? targetIndex

  recipeIngredientsCollection.update(current.id, (draft) => {
    draft.sortOrder = targetSortOrder
    draft.updatedAt = now
  })

  recipeIngredientsCollection.update(target.id, (draft) => {
    draft.sortOrder = currentSortOrder
    draft.updatedAt = now
  })

  maybeResequenceRecipeIngredients(recipeId)
}
