import { useCallback } from 'react';

import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FoodItem } from '@/lib/db';
import { foodItemsCollection, recipeIngredientsCollection } from '@/lib/db';
import { cn } from '@/lib/utils';

type AddIngredientButtonProps = {
  recipeId: string;
  selectedFoodId?: string | null;
  pendingFoodName?: string;
  onAfterAdd?: () => void;
  className?: string;
};

export function AddIngredientButton({
  recipeId,
  selectedFoodId,
  pendingFoodName,
  onAfterAdd,
  className,
}: AddIngredientButtonProps) {
  const handleAdd = useCallback(() => {
    const now = new Date().toISOString();

    if (selectedFoodId) {
      recipeIngredientsCollection.insert({
        id: crypto.randomUUID(),
        recipeId,
        foodId: selectedFoodId,
        quantityType: 'grams',
        quantityValue: 100,
        createdAt: now,
        updatedAt: now,
      });
      onAfterAdd?.();
      return;
    }

    const foodId = crypto.randomUUID();
    const ingredientId = crypto.randomUUID();
    const name = pendingFoodName?.trim() ? pendingFoodName.trim() : 'New Item';

    const placeholderFood: FoodItem = {
      id: foodId,
      name,
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
    onAfterAdd?.();
  }, [recipeId, selectedFoodId, pendingFoodName, onAfterAdd]);

  return (
    <Button
      type="button"
      onClick={handleAdd}
      className={cn(
        'flex h-11 items-center justify-center gap-2 border border-border px-6 text-sm font-semibold uppercase tracking-[0.35em]',
        className
      )}
    >
      <PlusIcon className="size-4" /> Add Ingredient
    </Button>
  );
}
