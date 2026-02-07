import { useCallback, useMemo, useRef, useState } from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';

import {
  foodItemsCollection,
  recipeIngredientsCollection,
  type FoodItem,
  useFoodItems,
} from '@/lib/db';
import { cn } from '@/lib/utils';
import { inputVariants } from '@/components/ui/input';

type AddIngredientButtonProps = {
  recipeId?: string;
  className?: string;
};

type ExistingFoodOption = {
  type: 'food';
  value: FoodItem;
};

type CreateFoodOption = {
  type: 'create';
  value: string;
};

type IngredientOption = ExistingFoodOption | CreateFoodOption;

export function IngredientLibrarySearch({
  recipeId,
  className,
}: AddIngredientButtonProps) {
  const foodsQuery = useFoodItems();
  const foods = foodsQuery.data ?? [];
  const [query, setQuery] = useState('');
  const highlightedItemRef = useRef<IngredientOption | undefined>(undefined);

  const normalizedQuery = query.trim().toLowerCase();
  const options = useMemo<IngredientOption[]>(() => {
    const base = normalizedQuery
      ? foods.filter((food) =>
          food.name.toLowerCase().includes(normalizedQuery)
        )
      : foods;

    const existingOptions: IngredientOption[] = base
      .slice(0, 8)
      .map((food) => ({ type: 'food', value: food }));

    return [
      ...existingOptions,
      {
        type: 'create',
        value: query.trim(),
      },
    ];
  }, [foods, normalizedQuery, query]);

  const resetInput = useCallback(() => {
    highlightedItemRef.current = undefined;
    setQuery('');
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

  const createFoodAndAddToRecipe = useCallback(
    (name: string) => {
      if (!recipeId) return;

      const trimmedName = name.trim();
      if (!trimmedName) return;

      const existingFood = foods.find(
        (food) => food.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingFood) {
        addIngredientToRecipe(existingFood.id);
        resetInput();
        return;
      }

      const now = new Date().toISOString();
      const foodId = crypto.randomUUID();
      const newFood: FoodItem = {
        id: foodId,
        name: trimmedName,
        caloriesPer100g: 0,
        proteinPer100g: 0,
        carbsPer100g: 0,
        fatPer100g: 0,
        createdAt: now,
        updatedAt: now,
      };

      foodItemsCollection.insert(newFood);
      addIngredientToRecipe(foodId);
      resetInput();
    },
    [addIngredientToRecipe, foods, recipeId, resetInput]
  );

  const handleQueryChange = useCallback((value: string) => {
    highlightedItemRef.current = undefined;
    setQuery(value);
  }, []);

  const handleSelectOption = useCallback(
    (option: IngredientOption) => {
      if (!recipeId) return;

      if (option.type === 'food') {
        addIngredientToRecipe(option.value.id);
        resetInput();
        return;
      }

      createFoodAndAddToRecipe(option.value);
    },
    [addIngredientToRecipe, createFoodAndAddToRecipe, recipeId, resetInput]
  );

  const hasExactMatch = useMemo(
    () =>
      !!normalizedQuery &&
      foods.some((food) => food.name.toLowerCase() === normalizedQuery),
    [foods, normalizedQuery]
  );

  const isCreateDisabled = !query.trim() || hasExactMatch;

  return (
    <Autocomplete.Root
      items={options}
      mode="none"
      value={query}
      onValueChange={handleQueryChange}
      itemToStringValue={(item) =>
        item.type === 'food' ? item.value.name : item.value
      }
      onItemHighlighted={(item) => {
        highlightedItemRef.current = item;
      }}
      disabled={!recipeId}
    >
      <Autocomplete.Input
        placeholder="Search food library or create"
        className={cn(inputVariants({ styling: 'largeSearch' }), className)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;

          const highlightedItem = highlightedItemRef.current;
          if (highlightedItem) {
            event.preventDefault();
            handleSelectOption(highlightedItem);
            return;
          }

          if (!isCreateDisabled) {
            event.preventDefault();
            createFoodAndAddToRecipe(query);
          }
        }}
      />

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="isolate z-50">
          <Autocomplete.Popup className="bg-popover text-popover-foreground ring-foreground/10 overflow-hidden rounded-none shadow-md ring-1 duration-100 max-h-(--available-height) w-(--anchor-width) max-w-(--available-width)">
            <Autocomplete.List className="no-scrollbar shadow-2xl  max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain">
              {(item: IngredientOption) => {
                if (item.type === 'food') {
                  return (
                    <Autocomplete.Item
                      key={item.value.id}
                      value={item}
                      className="data-highlighted:bg-accent data-highlighted:text-accent-foreground gap-2 rounded-none py-2 pr-8 pl-2 text-xs relative flex w-full cursor-default items-center outline-hidden select-none"
                      onClick={() => {
                        handleSelectOption(item);
                      }}
                    >
                      {item.value.name}
                    </Autocomplete.Item>
                  );
                }

                return (
                  <Autocomplete.Item
                    key={`create-${item.value || 'empty'}`}
                    value={item}
                    disabled={isCreateDisabled}
                    className="data-highlighted:bg-accent data-highlighted:text-accent-foreground border-border py-2 pr-8 pl-2 text-xs relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:opacity-50"
                    onClick={() => {
                      handleSelectOption(item);
                    }}
                  >
                    {hasExactMatch
                      ? `"${item.value}" already exists`
                      : item.value
                        ? `Create "${item.value}"`
                        : 'Type to create a new ingredient'}
                  </Autocomplete.Item>
                );
              }}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
