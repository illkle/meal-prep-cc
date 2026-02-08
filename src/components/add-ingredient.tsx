import { useCallback, useState } from 'react';
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

type ExistingFoodOption = FoodItem;

type CreateFoodOption = {
  type: 'create';
};

type IngredientOption = ExistingFoodOption | CreateFoodOption;

export function IngredientLibrarySearch({
  recipeId,
  className,
}: AddIngredientButtonProps) {
  const foodsQuery = useFoodItems();

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
      setInputValue('');
    },
    [recipeId]
  );

  const createFoodAndAddToRecipe = useCallback(
    (inputValue: string) => {
      if (!recipeId) return;

      const trimmedName = inputValue.trim();
      if (!trimmedName) return;

      const now = new Date().getTime();
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
      setInputValue('');
    },
    [addIngredientToRecipe, recipeId]
  );

  const [inputValue, setInputValue] = useState('');

  return (
    <Autocomplete.Root
      items={[...foodsQuery.data, { type: 'create', value: '' }]}
      autoHighlight
      filter={(item, query) => {
        if ('name' in item) {
          return item.name.toLowerCase().includes(query.toLowerCase());
        }
        return true;
      }}
      itemToStringValue={(item) => ('name' in item ? item.name : '')}
      disabled={!recipeId}
    >
      <Autocomplete.Input
        placeholder="Search food library or create"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        className={cn(inputVariants({ styling: 'largeSearch' }), className)}
      />

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="isolate z-50">
          <Autocomplete.Popup className="bg-popover text-popover-foreground ring-foreground/10 overflow-hidden rounded-none shadow-md ring-1 duration-100 max-h-(--available-height) w-(--anchor-width) max-w-(--available-width)">
            <Autocomplete.List className="no-scrollbar shadow-2xl  max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain">
              {(item: IngredientOption) => {
                if ('id' in item) {
                  return (
                    <Autocomplete.Item
                      key={item.id}
                      value={item}
                      onClick={() => addIngredientToRecipe(item.id)}
                      className="data-highlighted:bg-accent data-highlighted:text-accent-foreground gap-2 rounded-none py-2 pr-8 pl-2 text-xs relative flex w-full cursor-default items-center outline-hidden select-none"
                    >
                      {item.name}
                    </Autocomplete.Item>
                  );
                }

                return (
                  <Autocomplete.Item
                    key={`create`}
                    value={item}
                    onClick={() => createFoodAndAddToRecipe(inputValue)}
                    className="data-highlighted:bg-accent data-highlighted:text-accent-foreground border-border py-2 pr-8 pl-2 text-xs relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:opacity-50"
                  >
                    Create «{inputValue}»
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
