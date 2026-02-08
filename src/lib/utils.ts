import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSafeNumber(v: unknown, fallback: number = 0) {
  const toNumber = Number(v)
  if (!Number.isFinite(toNumber) || toNumber <= 0) {
    return fallback
  }
  return toNumber
}
