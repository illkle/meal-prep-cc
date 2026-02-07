import { useCallback, useEffect, useMemo, useState } from 'react';

import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { macroLabels } from '@/components/recipe-macro-summary';
import type { FoodItem, MacroTotals } from '@/lib/db';
import { foodItemsCollection, macroKeys, recipeIngredientsCollection } from '@/lib/db';

type MacroFieldKey =
  | 'caloriesPer100g'
  | 'proteinPer100g'
  | 'carbsPer100g'
  | 'fatPer100g';

const macroFieldMap: Record<keyof MacroTotals, MacroFieldKey> = {
  calories: 'caloriesPer100g',
  protein: 'proteinPer100g',
  carbs: 'carbsPer100g',
  fat: 'fatPer100g',
};

const columnWidths = {
  food: '40%',
  portionWeight: '16%',
  macro: '10%',
  actions: '8%',
};

const macroColumnHeaders = macroKeys.map((key) => ({
  key,
  label: macroLabels[key],
}));

export function FoodsTable({ foods }: { foods: Array<FoodItem> }) {
  const sortedFoods = useMemo(
    () =>
      [...foods].sort((a, b) => {
        const aDate = a.updatedAt ?? a.createdAt ?? '';
        const bDate = b.updatedAt ?? b.createdAt ?? '';
        return bDate.localeCompare(aDate);
      }),
    [foods]
  );

  const handleRename = useCallback((foodId: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    const now = new Date().toISOString();
    foodItemsCollection.update(foodId, (draft) => {
      draft.name = nextName;
      draft.updatedAt = now;
    });
  }, []);

  const handlePortionWeight = useCallback((foodId: string, weight?: number) => {
    const now = new Date().toISOString();
    foodItemsCollection.update(foodId, (draft) => {
      if (weight && weight > 0) {
        draft.portionWeight = weight;
      } else {
        delete draft.portionWeight;
      }
      draft.updatedAt = now;
    });
  }, []);

  const handleMacroChange = useCallback(
    (foodId: string, key: keyof MacroTotals, value: number) => {
      const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0;
      const now = new Date().toISOString();
      const targetKey = macroFieldMap[key];
      foodItemsCollection.update(foodId, (draft) => {
        draft[targetKey] = sanitized;
        draft.updatedAt = now;
      });
    },
    []
  );

  const handleDelete = useCallback((foodId: string) => {
    const ingredientIds = Array.from(recipeIngredientsCollection.values())
      .filter((ingredient) => ingredient.foodId === foodId)
      .map((ingredient) => ingredient.id);

    if (ingredientIds.length) {
      recipeIngredientsCollection.delete(ingredientIds);
    }

    foodItemsCollection.delete(foodId);
  }, []);

  return (
    <div className="min-w-full rounded-none border border-border">
      <table className="min-w-full table-fixed border-collapse text-left text-xs uppercase tracking-[0.2em]">
        <thead>
          <tr className="bg-muted/40">
            <th className="p-0" style={{ width: columnWidths.food }}>
              <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                Food
              </div>
            </th>
            <th className="p-0" style={{ width: columnWidths.portionWeight }}>
              <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                Unit Weight
              </div>
            </th>
            {macroColumnHeaders.map(({ key, label }) => (
              <th key={key} className="p-0" style={{ width: columnWidths.macro }}>
                <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                  {label}
                </div>
              </th>
            ))}
            <th className="p-0" style={{ width: columnWidths.actions }}>
              <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFoods.map((food, index) => (
            <FoodRow
              key={food.id}
              food={food}
              rowIndex={index}
              onRename={handleRename}
              onPortionWeight={handlePortionWeight}
              onMacroChange={handleMacroChange}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>

      {sortedFoods.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
          No foods found.
        </div>
      ) : null}
    </div>
  );
}

type FoodRowProps = {
  food: FoodItem;
  rowIndex: number;
  onRename: (foodId: string, value: string) => void;
  onPortionWeight: (foodId: string, weight?: number) => void;
  onMacroChange: (foodId: string, key: keyof MacroTotals, value: number) => void;
  onDelete: (foodId: string) => void;
};

function FoodRow({
  food,
  rowIndex,
  onRename,
  onPortionWeight,
  onMacroChange,
  onDelete,
}: FoodRowProps) {
  const rowClassName = rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20';

  return (
    <tr className={rowClassName}>
      <td className="h-12" style={{ width: columnWidths.food }}>
        <FoodNameInput food={food} onRename={onRename} />
      </td>
      <td className="h-12" style={{ width: columnWidths.portionWeight }}>
        <InlineNumberInput
          value={food.portionWeight ?? 0}
          onCommit={(value) => onPortionWeight(food.id, value)}
        />
      </td>
      {macroColumnHeaders.map(({ key }) => (
        <td key={key} className="h-12" style={{ width: columnWidths.macro }}>
          <InlineNumberInput
            value={food[macroFieldMap[key]]}
            onCommit={(value) => onMacroChange(food.id, key, value)}
          />
        </td>
      ))}
      <td className="h-12" style={{ width: columnWidths.actions }}>
        <button
          type="button"
          onClick={() => onDelete(food.id)}
          className="flex h-full w-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-destructive/40"
          aria-label="Remove food"
        >
          <Trash2Icon className="size-4" />
        </button>
      </td>
    </tr>
  );
}

function FoodNameInput({
  food,
  onRename,
}: {
  food: FoodItem;
  onRename: (foodId: string, name: string) => void;
}) {
  const [value, setValue] = useState(food.name);

  useEffect(() => {
    setValue(food.name);
  }, [food.name]);

  const handleCommit = () => {
    const nextValue = value.trim();
    if (!nextValue || nextValue === food.name) return;
    onRename(food.id, nextValue);
  };

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleCommit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleCommit();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setValue(food.name);
          event.currentTarget.blur();
        }
      }}
      className="h-12 w-full border-0 px-3 text-left text-base font-semibold uppercase tracking-[0.2em]"
    />
  );
}

function InlineNumberInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (value: number) => void;
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(event) => onCommit(Number(event.target.value))}
      className="h-12 w-full border-0 px-2 text-xs"
    />
  );
}
