import { useCallback, useMemo } from 'react';

import { macroColumnHeaders } from '@/components/food-table-shared';
import {
  useTableKeyboardNavigation,
  type TableKeyboardNavigation,
} from '@/components/table-keyboard-navigation';
import {
  EditableNumberCellInput,
  EditableTextCellInput,
  TableRowDeleteButton,
} from '@/components/table-editable-cells';
import type { FoodItem, MacroTotals, RecipeIngredient } from '@/lib/db';
import {
  calculateIngredientMacros,
  getFoodMacroValue,
  gramsForIngredient,
  renameFoodItem,
  recipeIngredientsCollection,
  setFoodMacroValue,
  setFoodPortionWeight,
} from '@/lib/db';
import { useFood, useRecipeIngredients } from '@/lib/db';

const columnWidths = {
  food: '30%',
  portionWeight: '12%',
  macro: '7%',
  units: '8%',
  grams: '10%',
  actions: '6%',
};

const ingredientColumnIds = [
  'food',
  'portionWeight',
  ...macroColumnHeaders.map(({ key }) => key),
  'units',
  'grams',
];

export type IngredientRow = {
  ingredient: RecipeIngredient;
  food: FoodItem;
  grams: number;
  units: number | null;
  macros: MacroTotals;
};

const totalTableColumns = macroColumnHeaders.length + 5;

export function IngredientsTable({ recipeId }: { recipeId: string }) {
  const recipeIngredientsQuery = useRecipeIngredients(recipeId);

  const ingredients = recipeIngredientsQuery.data ?? [];

  const handleUnitsChange = useCallback(
    (
      ingredientId: string,
      nextValue: number,
      timestamp: number = new Date().getTime()
    ) => {
      if (!Number.isFinite(nextValue) || nextValue <= 0) return;
      recipeIngredientsCollection.update(ingredientId, (draft) => {
        draft.quantityType = 'portions';
        draft.quantityValue = nextValue;
        draft.updatedAt = timestamp;
      });
    },
    []
  );

  const handleGramsChange = useCallback(
    (
      ingredientId: string,
      nextValue: number,
      timestamp: number = new Date().getTime()
    ) => {
      if (!Number.isFinite(nextValue) || nextValue <= 0) return;
      recipeIngredientsCollection.update(ingredientId, (draft) => {
        draft.quantityType = 'grams';
        draft.quantityValue = nextValue;
        draft.updatedAt = timestamp;
      });
    },
    []
  );

  const handleDelete = useCallback((ingredientId: string) => {
    recipeIngredientsCollection.delete(ingredientId);
  }, []);

  const navigation = useTableKeyboardNavigation({
    rowIds: ingredients.map((ingredient) => ingredient.id),
    columnIds: ingredientColumnIds,
  });

  return (
    <div
      ref={navigation.tableRef}
      tabIndex={0}
      className="min-w-full rounded-none border border-border outline-none"
      {...navigation.tableInteractionProps}
    >
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
              onRename={renameFoodItem}
              onPortionWeight={setFoodPortionWeight}
              onMacroChange={setFoodMacroValue}
              onUnitsChange={handleUnitsChange}
              onGramsChange={handleGramsChange}
              onDelete={handleDelete}
              navigation={navigation}
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
  onPortionWeight: (foodId: string, weight: number, timestamp: number) => void;
  onMacroChange: (
    foodId: string,
    key: keyof MacroTotals,
    value: number,
    timestamp: number
  ) => void;
  onUnitsChange: (
    ingredientId: string,
    nextValue: number,
    timestamp: number
  ) => void;
  onGramsChange: (
    ingredientId: string,
    nextValue: number,
    timestamp: number
  ) => void;
  onDelete: (ingredientId: string) => void;
  navigation: TableKeyboardNavigation;
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
  navigation,
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
      <td
        className=" h-12"
        style={{ width: columnWidths.food }}
        ref={navigation.registerCell({
          rowId: row.ingredient.id,
          colId: 'food',
          editable: true,
          editorType: 'text',
        })}
      >
        <EditableTextCellInput
          value={row.food.name}
          onCommit={(value) => onRename(row.food.id, value)}
          className="h-12 w-full border-0 px-3 text-left text-base font-semibold uppercase tracking-[0.2em]"
          {...navigation.getEditorHandlers(
            {
              rowId: row.ingredient.id,
              colId: 'food',
            },
            { selectAllOnFocus: false }
          )}
        />
      </td>
      <td
        className=" h-12"
        style={{ width: columnWidths.portionWeight }}
        ref={navigation.registerCell({
          rowId: row.ingredient.id,
          colId: 'portionWeight',
          editable: true,
          editorType: 'number',
        })}
      >
        <EditableNumberCellInput
          value={row.food.portionWeight ?? 0}
          onCommit={(value, timestamp) =>
            onPortionWeight(row.food.id, value, timestamp)
          }
          className="h-12 w-full border-0 px-2 text-xs"
          dbTimestamp={new Date(row.ingredient.updatedAt)}
          {...navigation.getEditorHandlers({
            rowId: row.ingredient.id,
            colId: 'portionWeight',
          })}
        />
      </td>
      {macroColumnHeaders.map(({ key }) => (
        <td
          key={key}
          className="h-12"
          style={{ width: columnWidths.macro }}
          ref={navigation.registerCell({
            rowId: row.ingredient.id,
            colId: key,
            editable: true,
            editorType: 'number',
          })}
        >
          <EditableNumberCellInput
            value={getFoodMacroValue(row.food, key)}
            onCommit={(value, timestamp) =>
              onMacroChange(row.food.id, key, value, timestamp)
            }
            dbTimestamp={new Date(row.food.updatedAt)}
            className="h-12 w-full border-0 px-2 text-xs"
            {...navigation.getEditorHandlers({
              rowId: row.ingredient.id,
              colId: key,
            })}
          />
        </td>
      ))}
      <td
        className=" h-12"
        style={{ width: columnWidths.units }}
        ref={navigation.registerCell({
          rowId: row.ingredient.id,
          colId: 'units',
          editable: Boolean(row.food.portionWeight),
          editorType: 'number',
        })}
      >
        {row.food.portionWeight ? (
          <EditableNumberCellInput
            value={row.units ?? 0}
            onCommit={(value, timestamp) =>
              onUnitsChange(row.ingredient.id, value, timestamp)
            }
            className="h-12 w-full border-0 px-2 text-xs"
            dbTimestamp={new Date(row.ingredient.updatedAt)}
            {...navigation.getEditorHandlers({
              rowId: row.ingredient.id,
              colId: 'units',
            })}
          />
        ) : (
          <div className="flex h-12 w-full items-center px-3 text-sm text-muted-foreground">
            —
          </div>
        )}
      </td>
      <td
        className="h-12"
        style={{ width: columnWidths.grams }}
        ref={navigation.registerCell({
          rowId: row.ingredient.id,
          colId: 'grams',
          editable: true,
          editorType: 'number',
        })}
      >
        <EditableNumberCellInput
          value={row.grams ?? 0}
          onCommit={(value, timestamp) =>
            onGramsChange(row.ingredient.id, value, timestamp)
          }
          className="h-12 w-full border-0 px-2 text-xs"
          dbTimestamp={new Date(row.ingredient.updatedAt)}
          {...navigation.getEditorHandlers({
            rowId: row.ingredient.id,
            colId: 'grams',
          })}
        />
      </td>
      <td className="h-12" style={{ width: columnWidths.actions }}>
        <TableRowDeleteButton
          onDelete={() => onDelete(row.ingredient.id)}
          ariaLabel="Remove ingredient"
        />
      </td>
    </tr>
  );
}
