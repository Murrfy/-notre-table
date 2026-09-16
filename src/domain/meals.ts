import type { MealType } from '../types';

/**
 * Canonical visual order for a normal day. Keep this shared so Today,
 * Presence and the weekly planner cannot drift into different sequences.
 */
export const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

/**
 * The meal that deserves focus on Today at a given local hour.
 * This is intentionally simple and deterministic; it does not infer behavior
 * from location, calendar or personal data.
 */
export function focusMealForHour(hour:number):MealType{
  const h=Number.isFinite(hour)?Math.max(0,Math.min(23,Math.floor(hour))):12;
  if(h<10)return 'breakfast';
  if(h<14)return 'lunch';
  if(h<17)return 'snack';
  return 'dinner';
}
