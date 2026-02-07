import type { MacroTotals } from './db/schema'

export const macroFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

export const calorieFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function formatMacroValue(key: keyof MacroTotals, value: number) {
  return key === 'calories'
    ? calorieFormatter.format(value)
    : macroFormatter.format(value)
}
