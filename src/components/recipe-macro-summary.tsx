import { useMemo, useState } from 'react';

import { RefreshCcw } from 'lucide-react';

import {
  calculateIngredientMacros,
  emptyMacroTotals,
  macroKeys,
  perPortionMacros,
  sumMacros,
  useFoodsInRecipe,
  type MacroTotals,
} from '@/lib/db';

export const macroLabels: Record<keyof MacroTotals, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

const macroFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const calorieFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export function RecipeMacroSummary({
  foodsInRecipeQuery,
  portions,
}: {
  foodsInRecipeQuery: ReturnType<typeof useFoodsInRecipe>;
  portions: number;
}) {
  const nutrition = useMemo(() => {
    if (!foodsInRecipeQuery.data) {
      return undefined;
    }

    const totals = sumMacros(
      foodsInRecipeQuery.data.map(({ ingredient, food }) =>
        calculateIngredientMacros(ingredient, food)
      )
    );

    return {
      totals,
    };
  }, [foodsInRecipeQuery.data]);

  const [primaryView, setPrimaryView] = useState<PrimaryView>('portion');
  const portionCount = portions > 0 ? portions : 1;
  const totals = nutrition?.totals ?? emptyMacroTotals;
  const portionTotals = perPortionMacros(totals, portionCount);

  return (
    <div className="">
      <div className="rounded-sm border border-border border-t-0 bg-background/80 ">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <div className="flex flex-1 flex-wrap gap-6">
            {macroKeys.map((key) => {
              const recipeValue = formatMacroValue(key, totals[key]);
              const portionValue = formatMacroValue(key, portionTotals[key]);
              const primaryValue =
                primaryView === 'recipe' ? recipeValue : portionValue;
              const secondaryValue =
                primaryView === 'recipe' ? portionValue : recipeValue;

              return (
                <MacroStat
                  key={key}
                  label={macroLabels[key]}
                  primaryValue={primaryValue}
                  secondaryValue={secondaryValue}
                />
              );
            })}
          </div>
          <ViewToggleButton
            value={primaryView}
            onToggle={() =>
              setPrimaryView((prev) =>
                prev === 'recipe' ? 'portion' : 'recipe'
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

type PrimaryView = 'recipe' | 'portion';

type MacroStatProps = {
  label: string;
  primaryValue: string;
  secondaryValue: string;
};

function MacroStat({ label, primaryValue, secondaryValue }: MacroStatProps) {
  return (
    <div className="min-w-[110px] flex-1 p-4">
      <p className="text-[0.55rem] uppercase tracking-[0.35em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">
        <p className="text-3xl font-semibold tracking-tight">{primaryValue}</p>
        <p className="text-sm font-medium text-muted-foreground">
          {secondaryValue}
        </p>
      </div>
    </div>
  );
}

type ViewToggleButtonProps = {
  value: PrimaryView;
  onToggle: () => void;
};

function ViewToggleButton({ value, onToggle }: ViewToggleButtonProps) {
  const isRecipePrimary = value === 'recipe';
  const largeText = isRecipePrimary ? 'Total' : 'Portion';
  const smallText = isRecipePrimary ? 'Portion' : 'Total';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group relative min-w-[140px] rounded-sm border-l px-4 border-border bg-background text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle between recipe and portion values"
    >
      <div className="transition-opacity group-hover:opacity-30">
        <p className="text-xl font-semibold uppercase ">{largeText}</p>
        <p className="text-xs uppercase text-muted-foreground">{smallText}</p>
      </div>
      <RefreshCcw className="pointer-events-none absolute inset-0 m-auto size-5 opacity-0 transition-opacity group-hover:opacity-120" />
    </button>
  );
}

function formatMacroValue(key: keyof MacroTotals, value: number) {
  return key === 'calories'
    ? calorieFormatter.format(value)
    : macroFormatter.format(value);
}
