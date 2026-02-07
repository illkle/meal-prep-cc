import { useCallback, useMemo, useState } from 'react';

import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FoodItem } from '@/lib/db';
import {
  foodItemsCollection,
  recipeIngredientsCollection,
  useFoodItems,
} from '@/lib/db';
import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

type AddIngredientButtonProps = {
  recipeId?: string;
  className?: string;
};

export function AddIngredientButton({
  recipeId,
  className,
}: AddIngredientButtonProps) {
  const foodsQuery = useFoodItems();
  const foods = foodsQuery.data ?? [];
  const [query, setQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const base = normalizedQuery
      ? foods.filter((food) =>
          food.name.toLowerCase().includes(normalizedQuery)
        )
      : foods;

    return base.slice(0, 8);
  }, [foods, normalizedQuery]);

  const resetInput = useCallback(() => {
    setQuery('');
    setSelectedFoodId(null);
  }, []);

  const addIngredientToRecipe = useCallback(
    (foodId: string) => {
      if (!recipeId) return;
      const now = new Date().toISOString();
      recipeIngredientsCollection.insert({
        id: crypto.randomUUID(),
        recipeId,
        foodId,
        quantityType: 'grams',
        quantityValue: 100,
        createdAt: now,
        updatedAt: now,
      });
    },
    [recipeId]
  );

  const handleSelectFood = useCallback(
    (value: string | null) => {
      if (!value) {
        setSelectedFoodId(null);
        return;
      }

      if (recipeId) {
        addIngredientToRecipe(value);
      }
    },
    [addIngredientToRecipe, foods, recipeId, resetInput]
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedFoodId(null);
  }, []);

  const handleAdd = useCallback(() => {
    const timestamp = new Date().toISOString();
    const trimmed = query.trim();

    let targetFoodId = selectedFoodId;

    if (!targetFoodId) {
      const normalized = trimmed.toLowerCase();
      const existingMatch = normalized
        ? foods.find((food) => food.name.toLowerCase() === normalized)
        : undefined;

      if (existingMatch) {
        targetFoodId = existingMatch.id;
      } else {
        const foodId = crypto.randomUUID();
        const newFood: FoodItem = {
          id: foodId,
          name: trimmed || 'New Item',
          caloriesPer100g: 0,
          proteinPer100g: 0,
          carbsPer100g: 0,
          fatPer100g: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        foodItemsCollection.insert(newFood);
        targetFoodId = foodId;
      }
    }

    if (recipeId && targetFoodId) {
      addIngredientToRecipe(targetFoodId);
    }

    resetInput();
  }, [
    addIngredientToRecipe,
    foods,
    query,
    recipeId,
    resetInput,
    selectedFoodId,
  ]);

  return (
    <div className={cn('flex flex-col  sm:flex-row items-stretch', className)}>
      <IngredientSearchInput
        query={query}
        matches={matches}
        isLoading={foodsQuery.isLoading}
        selectedFoodId={selectedFoodId}
        onQueryChange={handleQueryChange}
        onSelectFood={handleSelectFood}
      />
      <Button
        type="button"
        onClick={handleAdd}
        className="flex  h-auto items-center justify-center gap-2 border border-border px-6 text-sm font-semibold uppercase tracking-[0.35em] sm:w-auto"
      >
        <PlusIcon className="size-4" />{' '}
        {recipeId ? 'Add Ingredient' : 'Add Food'}
      </Button>
    </div>
  );
}

type IngredientSearchInputProps = {
  query: string;
  matches: Array<FoodItem>;
  isLoading: boolean;
  selectedFoodId: string | null;
  onQueryChange: (value: string) => void;
  onSelectFood: (value: string | null) => void;
};

function IngredientSearchInput({
  query,
  matches,
  isLoading,
  selectedFoodId,
  onQueryChange,
  onSelectFood,
}: IngredientSearchInputProps) {
  const trimmed = query.trim();

  return (
    <div className="relative flex-1">
      <Combobox
        value={selectedFoodId}
        onValueChange={onSelectFood}
        inputValue={query}
        onInputValueChange={onQueryChange}
      >
        <ComboboxInput
          placeholder="Search foods"
          showTrigger={false}
          className="h-12 border-none px-0 [&_[data-slot=input-group-control]]:h-12 [&_[data-slot=input-group-control]]:px-3 [&_[data-slot=input-group-control]]:text-left [&_[data-slot=input-group-control]]:text-sm [&_[data-slot=input-group-control]]:font-semibold [&_[data-slot=input-group-control]]:uppercase [&_[data-slot=input-group-control]]:tracking-[0.3em]"
        />
        <ComboboxContent className="border border-border text-[0.6rem] uppercase tracking-[0.3em]">
          {isLoading ? (
            <div className="px-3 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Searching…
            </div>
          ) : matches.length ? (
            <ComboboxList className="p-0">
              {matches.map((food) => (
                <ComboboxItem
                  key={food.id}
                  value={food.id}
                  className="text-[0.55rem] font-semibold uppercase tracking-[0.3em]"
                >
                  {food.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          ) : trimmed.length ? (
            <div className="px-3 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Press add to create "{trimmed}"
            </div>
          ) : (
            <div className="px-3 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              No foods available
            </div>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
