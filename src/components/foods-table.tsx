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
import type { FoodItem, MacroTotals } from '@/lib/db';
import {
  foodItemsCollection,
  getFoodMacroValue,
  recipeIngredientsCollection,
  renameFoodItem,
  setFoodMacroValue,
  setFoodPortionWeight,
} from '@/lib/db';

const columnWidths = {
  food: '40%',
  portionWeight: '16%',
  macro: '10%',
  actions: '8%',
};

const foodColumnIds = [
  'food',
  'portionWeight',
  ...macroColumnHeaders.map(({ key }) => key),
];

export function FoodsTable({ foods }: { foods: Array<FoodItem> }) {
  const sortedFoods = useMemo(
    () =>
      [...foods].sort((a, b) => {
        const aName = a.name.toLowerCase() ?? 'Unnamed';
        const bName = b.name.toLowerCase() ?? 'Unnamed';
        return aName.localeCompare(bName);
      }),
    [foods]
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

  const navigation = useTableKeyboardNavigation({
    rowIds: sortedFoods.map((food) => food.id),
    columnIds: foodColumnIds,
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
              onRename={renameFoodItem}
              onPortionWeight={setFoodPortionWeight}
              onMacroChange={setFoodMacroValue}
              onDelete={handleDelete}
              navigation={navigation}
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
  onMacroChange: (
    foodId: string,
    key: keyof MacroTotals,
    value: number
  ) => void;
  onDelete: (foodId: string) => void;
  navigation: TableKeyboardNavigation;
};

function FoodRow({
  food,
  rowIndex,
  onRename,
  onPortionWeight,
  onMacroChange,
  onDelete,
  navigation,
}: FoodRowProps) {
  const rowClassName = rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20';

  return (
    <tr className={rowClassName}>
      <td
        className="h-12"
        style={{ width: columnWidths.food }}
        ref={navigation.registerCell({
          rowId: food.id,
          colId: 'food',
          editable: true,
          editorType: 'text',
        })}
      >
        <EditableTextCellInput
          value={food.name}
          onCommit={(value) => onRename(food.id, value)}
          className="h-12 w-full border-0 px-3 text-left text-base font-semibold uppercase tracking-[0.2em]"
          {...navigation.getEditorHandlers(
            { rowId: food.id, colId: 'food' },
            { selectAllOnFocus: false }
          )}
        />
      </td>
      <td
        className="h-12"
        style={{ width: columnWidths.portionWeight }}
        ref={navigation.registerCell({
          rowId: food.id,
          colId: 'portionWeight',
          editable: true,
          editorType: 'number',
        })}
      >
        <EditableNumberCellInput
          value={food.portionWeight ?? 0}
          onCommit={(value) => onPortionWeight(food.id, value)}
          className="h-12 w-full border-0 px-2 text-xs"
          {...navigation.getEditorHandlers({
            rowId: food.id,
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
            rowId: food.id,
            colId: key,
            editable: true,
            editorType: 'number',
          })}
        >
          <EditableNumberCellInput
            value={getFoodMacroValue(food, key)}
            onCommit={(value) => onMacroChange(food.id, key, value)}
            className="h-12 w-full border-0 px-2 text-xs"
            {...navigation.getEditorHandlers({ rowId: food.id, colId: key })}
          />
        </td>
      ))}
      <td className="h-12" style={{ width: columnWidths.actions }}>
        <TableRowDeleteButton
          onDelete={() => onDelete(food.id)}
          ariaLabel="Remove food"
        />
      </td>
    </tr>
  );
}
