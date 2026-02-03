import { macroKeys, type MacroTotals } from '@/lib/db';

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

type RecipeMacroSummaryProps = {
  nutrition?: { totals: MacroTotals };
  portions: number;
  isLoading: boolean;
};

export function RecipeMacroSummary({
  nutrition,
  portions,
  isLoading,
}: RecipeMacroSummaryProps) {
  const portionCount = portions > 0 ? portions : 1;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-px border border-border sm:grid-cols-5">
        <StatCell
          label="Total Calories"
          value={
            nutrition ? calorieFormatter.format(nutrition.totals.calories) : '0'
          }
          helper="Recipe"
        />
        {macroKeys.map((key) => (
          <StatCell
            key={key}
            label={`${macroLabels[key]} / Portion`}
            value={macroFormatter.format(
              (nutrition?.totals[key] ?? 0) / portionCount
            )}
            helper="Per Portion"
          />
        ))}
      </div>
      {isLoading ? (
        <p className="mt-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Loading...
        </p>
      ) : null}
    </div>
  );
}

type StatCellProps = {
  label: string;
  value: string;
  helper: string;
};

function StatCell({ label, value, helper }: StatCellProps) {
  return (
    <div className="bg-background px-4 py-3 text-left">
      <p className="text-[0.55rem] uppercase tracking-[0.4em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-widest">{value}</p>
      <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}
