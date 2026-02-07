import { macroLabels } from '@/components/recipe-macro-summary';
import { macroKeys } from '@/lib/db';

export const macroColumnHeaders = macroKeys.map((key) => ({
  key,
  label: macroLabels[key],
}));
