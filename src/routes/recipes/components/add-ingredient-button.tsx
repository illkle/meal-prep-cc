import { useCallback } from 'react';

import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FoodItem } from '@/lib/db';
import { foodItemsCollection, recipeIngredientsCollection } from '@/lib/db';

export function AddIngredientButton({ recipeId }: { recipeId: string }) {
  const handleAdd = useCallback(() => {
    const now = new Date().toISOString();
    const foodId = crypto.randomUUID();
    const ingredientId = crypto.randomUUID();

    const placeholderFood: FoodItem = {
      id: foodId,
      name: 'New Item',
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      createdAt: now,
      updatedAt: now,
    };

    foodItemsCollection.insert(placeholderFood);

    recipeIngredientsCollection.insert({
      id: ingredientId,
      recipeId,
      foodId,
      quantityType: 'grams',
      quantityValue: 100,
      createdAt: now,
      updatedAt: now,
    });
  }, [recipeId]);

  return (
    <Button
      type="button"
      onClick={handleAdd}
      className="flex w-full items-center justify-center gap-2 border border-border py-6 text-sm font-semibold uppercase tracking-[0.35em]"
    >
      <PlusIcon className="size-4" /> Add Ingredient
    </Button>
  );
}
