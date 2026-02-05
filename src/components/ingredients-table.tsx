import { useCallback, useEffect, useMemo, useState } from 'react';

import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { macroLabels } from '@/components/recipe-macro-summary';
import type { FoodItem, MacroTotals, RecipeIngredient } from '@/lib/db';
import {
  calculateIngredientMacros,
  foodItemsCollection,
  gramsForIngredient,
  macroKeys,
  recipeIngredientsCollection,
} from '@/lib/db';
import { useFood, useRecipeIngredients } from '@/lib/db';

const macroFieldMap: Record<keyof MacroTotals, MacroFieldKey> = {
  calories: 'caloriesPer100g',
  protein: 'proteinPer100g',
  carbs: 'carbsPer100g',
  fat: 'fatPer100g',
};

const columnWidths = {
  food: '30%',
  portionWeight: '12%',
  macro: '7%',
  units: '8%',
  grams: '10%',
  actions: '6%',
};

type MacroFieldKey =
  | 'caloriesPer100g'
  | 'proteinPer100g'
  | 'carbsPer100g'
  | 'fatPer100g';

export type IngredientRow = {
  ingredient: RecipeIngredient;
  food: FoodItem;
  grams: number;
  units: number | null;
  macros: MacroTotals;
};

const macroColumnHeaders = macroKeys.map((key) => ({
  key,
  label: macroLabels[key],
}));

const totalTableColumns = macroKeys.length + 5;

export function IngredientsTable({ recipeId }: { recipeId: string }) {
  const recipeIngredientsQuery = useRecipeIngredients(recipeId);

  const ingredients = recipeIngredientsQuery.data ?? [];

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

  const handleUnitsChange = useCallback(
    (ingredientId: string, nextValue: number) => {
      if (!Number.isFinite(nextValue) || nextValue <= 0) return;
      const now = new Date().toISOString();
      recipeIngredientsCollection.update(ingredientId, (draft) => {
        draft.quantityType = 'portions';
        draft.quantityValue = nextValue;
        draft.updatedAt = now;
      });
    },
    []
  );

  const handleGramsChange = useCallback(
    (ingredientId: string, nextValue: number) => {
      if (!Number.isFinite(nextValue) || nextValue <= 0) return;
      const now = new Date().toISOString();
      recipeIngredientsCollection.update(ingredientId, (draft) => {
        draft.quantityType = 'grams';
        draft.quantityValue = nextValue;
        draft.updatedAt = now;
      });
    },
    []
  );

  const handleDelete = useCallback((ingredientId: string) => {
    recipeIngredientsCollection.delete(ingredientId);
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
              <th
                key={key}
                className="p-0"
                style={{ width: columnWidths.macro }}
              >
                <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                  {label}
                </div>
              </th>
            ))}
            <th className="p-0" style={{ width: columnWidths.units }}>
              <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                Units
              </div>
            </th>
            <th className="p-0" style={{ width: columnWidths.grams }}>
              <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                Grams
              </div>
            </th>
            <th className="p-0" style={{ width: columnWidths.actions }}>
              <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground" />
            </th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient, index) => (
            <IngredientTableRow
              key={ingredient.id}
              ingredient={ingredient}
              rowIndex={index}
              onRename={handleRename}
              onPortionWeight={handlePortionWeight}
              onMacroChange={handleMacroChange}
              onUnitsChange={handleUnitsChange}
              onGramsChange={handleGramsChange}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>

      {recipeIngredientsQuery.data?.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
          No ingredients yet. Add one below.
        </div>
      ) : null}
    </div>
  );
}

type IngredientTableRowProps = {
  ingredient: RecipeIngredient;
  rowIndex: number;
  onRename: (foodId: string, name: string) => void;
  onPortionWeight: (foodId: string, weight?: number) => void;
  onMacroChange: (
    foodId: string,
    key: keyof MacroTotals,
    value: number
  ) => void;
  onUnitsChange: (ingredientId: string, nextValue: number) => void;
  onGramsChange: (ingredientId: string, nextValue: number) => void;
  onDelete: (ingredientId: string) => void;
};

function IngredientTableRow({
  ingredient,
  rowIndex,
  onRename,
  onPortionWeight,
  onMacroChange,
  onUnitsChange,
  onGramsChange,
  onDelete,
}: IngredientTableRowProps) {
  const foodQuery = useFood(ingredient.foodId);
  const row = useMemo<IngredientRow | undefined>(() => {
    if (!foodQuery.data) {
      return undefined;
    }

    const grams = gramsForIngredient(ingredient, foodQuery.data);
    const macros = calculateIngredientMacros(ingredient, foodQuery.data);
    const units = foodQuery.data.portionWeight
      ? ingredient.quantityType === 'portions'
        ? ingredient.quantityValue
        : Math.round((grams / foodQuery.data.portionWeight) * 100) / 100 || null
      : null;

    return {
      ingredient,
      food: foodQuery.data,
      grams,
      units,
      macros,
    };
  }, [foodQuery.data, ingredient]);

  const rowClassName = rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20';

  if (!row) {
    return (
      <tr className={rowClassName}>
        <td
          className="px-3 py-4 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground"
          colSpan={totalTableColumns}
        >
          {foodQuery.isLoading ? 'Loading ingredient…' : 'Food not found'}
        </td>
      </tr>
    );
  }

  return (
    <tr className={rowClassName}>
      <td className="p-0" style={{ width: columnWidths.food }}>
        <FoodCell row={row} onRename={onRename} />
      </td>
      <td className="p-0" style={{ width: columnWidths.portionWeight }}>
        <InlineInput
          value={row.food.portionWeight ?? 0}
          onCommit={(value) => onPortionWeight(row.food.id, value)}
        />
      </td>
      {macroColumnHeaders.map(({ key }) => (
        <td key={key} className="p-0" style={{ width: columnWidths.macro }}>
          <InlineInput
            value={row.food[macroFieldMap[key]]}
            onCommit={(value) => onMacroChange(row.food.id, key, value)}
          />
        </td>
      ))}
      <td className="p-0" style={{ width: columnWidths.units }}>
        {row.food.portionWeight ? (
          <InlineInput
            value={row.units ?? 0}
            onCommit={(value) => onUnitsChange(row.ingredient.id, value)}
          />
        ) : (
          <div className="flex h-12 w-full items-center px-3 text-sm text-muted-foreground">
            —
          </div>
        )}
      </td>
      <td className="p-0" style={{ width: columnWidths.grams }}>
        <InlineInput
          value={row.grams ?? 0}
          onCommit={(value) => onGramsChange(row.ingredient.id, value)}
        />
      </td>
      <td className="p-0" style={{ width: columnWidths.actions }}>
        <button
          type="button"
          onClick={() => onDelete(row.ingredient.id)}
          className="flex h-full w-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Remove ingredient"
        >
          <Trash2Icon className="size-4" />
        </button>
      </td>
    </tr>
  );
}

function FoodCell({
  row,
  onRename,
}: {
  row: IngredientRow;
  onRename: (foodId: string, name: string) => void;
}) {
  const [value, setValue] = useState(row.food.name);

  useEffect(() => {
    setValue(row.food.name);
  }, [row.food.name]);

  const handleCommit = () => {
    const nextValue = value.trim();
    if (!nextValue || nextValue === row.food.name) return;
    onRename(row.food.id, nextValue);
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
          setValue(row.food.name);
          event.currentTarget.blur();
        }
      }}
      className="h-12 w-full border-0 px-3 text-left text-base font-semibold uppercase tracking-[0.2em]"
    />
  );
}

function InlineInput({
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
