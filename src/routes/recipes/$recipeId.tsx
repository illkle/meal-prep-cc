import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
} from '@tanstack/react-table';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import {
  RecipeMacroSummary,
  macroLabels,
} from '@/components/recipe-macro-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FoodItem, MacroTotals, Recipe, RecipeIngredient } from '@/lib/db';
import {
  foodItemsCollection,
  recipeIngredientsCollection,
  recipesCollection,
  useFoodItems,
  useRecipeNutrition,
} from '@/lib/db';
import {
  calculateIngredientMacros,
  gramsForIngredient,
  macroKeys,
} from '@/lib/db';

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipePage,
});

type IngredientRow = {
  ingredient: RecipeIngredient;
  food: FoodItem;
  grams: number;
  units: number | null;
  macros: MacroTotals;
};

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
  food: '30%',
  portionWeight: '12%',
  macro: '7%',
  units: '8%',
  grams: '10%',
  actions: '6%',
};

function RecipePage() {
  const { recipeId } = Route.useParams();
  const nutritionQuery = useRecipeNutrition(recipeId);
  const foodsQuery = useFoodItems();

  const recipe = nutritionQuery.recipe;
  const nutrition = nutritionQuery.nutrition;

  const rows: Array<IngredientRow> = useMemo(() => {
    if (!nutritionQuery.data) {
      return [];
    }

    return nutritionQuery.data.map(({ ingredient, food }) => {
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
  }, [nutritionQuery.data]);

  const table = useReactTable<IngredientRow>({
    data: rows,
    columns: useIngredientColumns({
      foods: foodsQuery.data ?? [],
    }),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.ingredient.id,
    state: {},
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16">
        <RecipeHero recipe={recipe} nutrition={nutrition} isLoading={!recipe} />

        <section className="flex flex-1 flex-col">
          <div className="mt-6 overflow-x-auto">
            <IngredientsTable table={table} isEmpty={!rows.length} />
          </div>

          <div className="mt-6">
            <AddIngredientButton recipeId={recipeId} />
          </div>
        </section>
      </main>
    </div>
  );
}

function RecipeHero({
  recipe,
  nutrition,
  isLoading,
}: {
  recipe?: Recipe;
  nutrition?: { totals: MacroTotals; perPortion?: MacroTotals };
  isLoading: boolean;
}) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [portions, setPortions] = useState(recipe?.portionsPrepared ?? 1);

  useEffect(() => {
    setName(recipe?.name ?? '');
    setPortions(recipe?.portionsPrepared ?? 1);
  }, [recipe?.name, recipe?.portionsPrepared]);

  const handleNameCommit = useCallback(() => {
    if (!recipe) return;
    const nextName = name.trim();
    if (!nextName || nextName === recipe.name) return;
    const now = new Date().toISOString();
    recipesCollection.update(recipe.id, (draft) => {
      draft.name = nextName;
      draft.updatedAt = now;
    });
  }, [name, recipe]);

  const handlePortionsCommit = useCallback(() => {
    if (!recipe) return;
    const nextValue = Number(portions);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      setPortions(recipe.portionsPrepared);
      return;
    }
    if (nextValue === recipe.portionsPrepared) return;
    const now = new Date().toISOString();
    recipesCollection.update(recipe.id, (draft) => {
      draft.portionsPrepared = nextValue;
      draft.updatedAt = now;
    });
  }, [portions, recipe]);

  console.log('portions', nutrition);

  return (
    <section className="border-b border-border py-8">
      <div className="flex flex-col  sm:flex-row ">
        <div className="flex w-full flex-1 flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-[0.5em] text-muted-foreground">
            Recipe Name
          </label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={handleNameCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleNameCommit();
              }
            }}
            disabled={!recipe}
            className="h-14 w-full border border-border bg-transparent px-4 text-3xl font-semibold uppercase tracking-[0.35em]"
          />
        </div>

        <div className="flex flex-col gap-2 sm:w-60">
          <label className="text-[0.6rem] uppercase tracking-[0.5em] text-muted-foreground">
            Portions Prepared
          </label>
          <Input
            type="number"
            value={portions}
            min={1}
            step={1}
            onChange={(event) => setPortions(Number(event.target.value))}
            onBlur={handlePortionsCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handlePortionsCommit();
              }
            }}
            disabled={!recipe}
            className="h-14 border border-border border-l-0 px-4 text-3xl font-semibold uppercase tracking-[0.35em]"
          />
        </div>
      </div>

      <RecipeMacroSummary
        nutrition={nutrition}
        portions={portions}
        isLoading={isLoading}
      />
    </section>
  );
}

function IngredientsTable({
  table,
  isEmpty,
}: {
  table: Table<IngredientRow>;
  isEmpty: boolean;
}) {
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

      {isEmpty ? (
        <div className="px-4 py-10 text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
          No ingredients yet. Add one below.
        </div>
      ) : null}
    </div>
  );
}

function AddIngredientButton({ recipeId }: { recipeId: string }) {
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
        header: 'Unit Weight (g)',
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
            <div className="px-3 py-2 text-muted-foreground">
              Type to search
            </div>
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
  allowEmptyClears,
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
  const [draft, setDraft] = useState(value?.toString() ?? '');

  useEffect(() => {
    setDraft(value?.toString() ?? '');
  }, [value]);

  const commit = useCallback(() => {
    if (!draft.trim().length && allowEmptyClears) {
      onCommit(0);
      setEditing(false);
      setDraft('');
      return;
    }
    const nextValue = Number.parseFloat(draft);
    if (!Number.isFinite(nextValue)) {
      setDraft(value?.toString() ?? '');
      setEditing(false);
      return;
    }
    onCommit(nextValue);
    setEditing(false);
  }, [allowEmptyClears, draft, onCommit, value]);

  return editing ? (
    <Input
      type="number"
      min={min}
      step={step}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
      }}
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
  const [draft, setDraft] = useState(value.toString());

  useEffect(() => {
    setDraft(value.toString());
  }, [value]);

  const commit = useCallback(() => {
    const next = Number.parseFloat(draft);
    if (!Number.isFinite(next)) {
      setDraft(value.toString());
      return;
    }
    onCommit(next);
  }, [draft, onCommit, value]);

  return (
    <Input
      type="number"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
      }}
      className="h-12 w-full border-0 px-2 text-xs"
    />
  );
}
