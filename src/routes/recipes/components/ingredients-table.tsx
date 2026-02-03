import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { macroLabels } from '@/components/recipe-macro-summary';
import type { FoodItem, MacroTotals, RecipeIngredient } from '@/lib/db';
import type { useFoodsInRecipe } from '@/lib/db';
import {
  calculateIngredientMacros,
  foodItemsCollection,
  gramsForIngredient,
  macroKeys,
  recipeIngredientsCollection,
} from '@/lib/db';

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

export function IngredientsTable({
  foodsInRecipeQuery,
}: {
  foodsInRecipeQuery: ReturnType<typeof useFoodsInRecipe>;
}) {
  const rows: Array<IngredientRow> = useMemo(() => {
    if (!foodsInRecipeQuery.data) {
      return [];
    }

    return foodsInRecipeQuery.data.map(({ ingredient, food }) => {
      const grams = gramsForIngredient(ingredient, food);
      const macros = calculateIngredientMacros(ingredient, food);
      const units = food.portionWeight
        ? ingredient.quantityType === 'portions'
          ? ingredient.quantityValue
          : Math.round((grams / food.portionWeight) * 100) / 100 || null
        : null;

      return {
        ingredient,
        food,
        grams,
        units,
        macros,
      };
    });
  }, [foodsInRecipeQuery.data]);

  const table = useReactTable<IngredientRow>({
    data: rows,
    columns: useIngredientColumns({
      foods: foodsInRecipeQuery.data?.map(({ food }) => food) ?? [],
    }),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.ingredient.id,
    state: {},
  });

  return (
    <div className="min-w-full rounded-none border border-border">
      <table className="min-w-full table-fixed border-collapse text-left text-xs uppercase tracking-[0.2em]">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-muted/40">
              {headerGroup.headers.map((header) => {
                const headerWidth = (
                  header.column.columnDef.meta as { width?: string } | undefined
                )?.width;
                return (
                  <th
                    key={header.id}
                    className="p-0"
                    style={headerWidth ? { width: headerWidth } : undefined}
                  >
                    <div className="px-3 py-2 text-[0.55rem] font-semibold text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              {row.getVisibleCells().map((cell) => {
                const cellWidth = (
                  cell.column.columnDef.meta as { width?: string } | undefined
                )?.width;
                return (
                  <td
                    key={cell.id}
                    className="p-0"
                    style={cellWidth ? { width: cellWidth } : undefined}
                  >
                    <div className="h-full">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {foodsInRecipeQuery.data?.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
          No ingredients yet. Add one below.
        </div>
      ) : null}
    </div>
  );
}

function useIngredientColumns({
  foods,
}: {
  foods: Array<FoodItem>;
}): ColumnDef<IngredientRow>[] {
  const handleRename = useCallback((foodId: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    const now = new Date().toISOString();
    foodItemsCollection.update(foodId, (draft) => {
      draft.name = nextName;
      draft.updatedAt = now;
    });
  }, []);

  const handleSwap = useCallback(
    (ingredient: RecipeIngredient, targetFoodId: string, grams: number) => {
      const now = new Date().toISOString();
      recipeIngredientsCollection.update(ingredient.id, (draft) => {
        draft.foodId = targetFoodId;
        draft.quantityType = 'grams';
        draft.quantityValue = Math.max(1, Math.round(grams * 100) / 100);
        draft.updatedAt = now;
      });
    },
    []
  );

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

  const handleUnitsChange = useCallback((ingredientId: string, nextValue: number) => {
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    const now = new Date().toISOString();
    recipeIngredientsCollection.update(ingredientId, (draft) => {
      draft.quantityType = 'portions';
      draft.quantityValue = nextValue;
      draft.updatedAt = now;
    });
  }, []);

  const handleGramsChange = useCallback((ingredientId: string, nextValue: number) => {
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    const now = new Date().toISOString();
    recipeIngredientsCollection.update(ingredientId, (draft) => {
      draft.quantityType = 'grams';
      draft.quantityValue = nextValue;
      draft.updatedAt = now;
    });
  }, []);

  const handleDelete = useCallback((ingredientId: string) => {
    recipeIngredientsCollection.delete(ingredientId);
  }, []);

  return useMemo<ColumnDef<IngredientRow>[]>(
    () => [
      {
        id: 'food',
        header: 'Food',
        meta: { width: columnWidths.food },
        cell: ({ row }) => (
          <FoodCell
            row={row.original}
            foods={foods}
            onRename={handleRename}
            onSwap={handleSwap}
          />
        ),
      },
      {
        id: 'portionWeight',
        header: 'Unit Weight',
        meta: { width: columnWidths.portionWeight },
        cell: ({ row }) => (
          <EditableNumberCell
            value={row.original.food.portionWeight ?? null}
            placeholder="—"
            onCommit={(value) =>
              handlePortionWeight(row.original.food.id, value)
            }
            min={1}
            step="1"
            allowEmptyClears
          />
        ),
      },
      ...macroKeys.map<ColumnDef<IngredientRow>>((key) => ({
        id: `${key}-column`,
        header: macroLabels[key],
        meta: { width: columnWidths.macro },
        cell: ({ row }) => (
          <InlineInput
            value={row.original.food[macroFieldMap[key]]}
            onCommit={(value) =>
              handleMacroChange(row.original.food.id, key, value)
            }
          />
        ),
      })),
      {
        id: 'units',
        header: 'Units',
        meta: { width: columnWidths.units },
        cell: ({ row }) =>
          row.original.food.portionWeight ? (
            <EditableNumberCell
              value={row.original.units}
              placeholder="—"
              onCommit={(value) =>
                handleUnitsChange(row.original.ingredient.id, value)
              }
              min={0.01}
              step="0.1"
            />
          ) : (
            <div className="flex h-12 w-full items-center px-3 text-sm text-muted-foreground">
              —
            </div>
          ),
      },
      {
        id: 'grams',
        header: 'Grams',
        meta: { width: columnWidths.grams },
        cell: ({ row }) => (
          <EditableNumberCell
            value={row.original.grams}
            placeholder="0"
            onCommit={(value) =>
              handleGramsChange(row.original.ingredient.id, value)
            }
            min={1}
            step="1"
            autoFocusOnEmpty
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: { width: columnWidths.actions },
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleDelete(row.original.ingredient.id)}
            className="flex h-full w-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Remove ingredient"
          >
            <Trash2Icon className="size-4" />
          </button>
        ),
      },
    ],
    [
      foods,
      handleDelete,
      handleGramsChange,
      handleMacroChange,
      handlePortionWeight,
      handleRename,
      handleSwap,
      handleUnitsChange,
    ]
  );
}

function FoodCell({
  row,
  foods,
  onRename,
  onSwap,
}: {
  row: IngredientRow;
  foods: Array<FoodItem>;
  onRename: (foodId: string, name: string) => void;
  onSwap: (ingredient: RecipeIngredient, foodId: string, grams: number) => void;
}) {
  const [query, setQuery] = useState(row.food.name);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setQuery(row.food.name);
  }, [row.food.name]);

  const normalized = query.trim().toLowerCase();
  const renameAvailable =
    normalized.length > 0 && normalized !== row.food.name.toLowerCase();

  const matches = useMemo(() => {
    if (!normalized.length)
      return foods.filter((food) => food.id !== row.food.id);
    return foods
      .filter((food) =>
        food.id === row.food.id
          ? false
          : food.name.toLowerCase().includes(normalized)
      )
      .slice(0, 6);
  }, [foods, normalized, row.food.id]);

  const handleSelect = (foodId: string) => {
    onSwap(row.ingredient, foodId, row.grams);
    setOpen(false);
  };

  const handleRename = () => {
    onRename(row.food.id, query);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 100);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && renameAvailable) {
            event.preventDefault();
            handleRename();
          }
        }}
        className="h-12 w-full border-0 px-3 text-left text-base font-semibold uppercase tracking-[0.2em]"
      />

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 border border-border bg-background text-[0.65rem] uppercase tracking-[0.3em] shadow-lg">
          {renameAvailable ? (
            <SuggestionButton onSelect={handleRename}>
              Rename to "{query.trim()}"
            </SuggestionButton>
          ) : null}
          {matches.map((food) => (
            <SuggestionButton
              key={food.id}
              onSelect={() => handleSelect(food.id)}
            >
              Swap to {food.name}
            </SuggestionButton>
          ))}
          {!renameAvailable && matches.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground">Type to search</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SuggestionButton({
  children,
  onSelect,
}: {
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className="flex w-full items-center justify-between px-3 py-2 text-left text-[0.55rem] font-semibold uppercase tracking-[0.3em] hover:bg-muted/60"
    >
      {children}
    </button>
  );
}

function EditableNumberCell({
  value,
  placeholder,
  onCommit,
  min,
  step,
  autoFocusOnEmpty,
}: {
  value: number | null;
  placeholder: string;
  onCommit: (value: number) => void;
  min?: number;
  step?: string;
  autoFocusOnEmpty?: boolean;
  allowEmptyClears?: boolean;
}) {
  const [editing, setEditing] = useState(autoFocusOnEmpty ? !value : false);

  return editing ? (
    <Input
      type="number"
      min={min}
      step={step}
      value={value ?? ''}
      onChange={(event) => onCommit(Number(event.target.value))}
      className="h-12 w-full border-0 px-3 text-xs"
      autoFocus
    />
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex h-12 w-full items-center px-3 text-left text-sm"
    >
      {value ? value : placeholder}
    </button>
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
