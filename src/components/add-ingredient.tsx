import { useState } from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';

import {
  addIngredientToRecipe,
  createFoodAndAddIngredient,
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
                      onClick={() => {
                        if (!recipeId) return;
                        addIngredientToRecipe(recipeId, item.id);
                        setInputValue('');
                      }}
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
                    onClick={() => {
                      if (!recipeId) return;
                      createFoodAndAddIngredient(recipeId, inputValue);
                      setInputValue('');
                    }}
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
