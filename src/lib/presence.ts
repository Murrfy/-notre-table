import type { MealType, MemberAbsence } from '../types';

/**
 * Meal presence is intentionally scoped to one calendar day and one meal.
 * A person may be away at lunch and still be present for dinner.
 */
export function isMemberAwayForMeal(rows:MemberAbsence[],userId:string,date:string,mealType:MealType):boolean {
  return rows.some(row=>row.user_id===userId&&row.absence_date===date&&row.meal_type===mealType);
}

export function countMealAbsences(rows:MemberAbsence[],date:string):number {
  return rows.filter(row=>row.absence_date===date).length;
}
