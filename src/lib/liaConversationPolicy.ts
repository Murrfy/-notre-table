export type LiaSupportLane='confidante'|'housekeeper'|'both';

/** LIA listens first. She may connect an emotional problem to a concrete household action
 * only when that action can genuinely help; she never drags every conversation back to food. */
export function liaSupportLane(input:{emotionalTopic:boolean;practicalHouseholdNeed:boolean;mealCouldHelp:boolean;userRejectedMealHelp:boolean}):LiaSupportLane{
  if(input.userRejectedMealHelp)return input.emotionalTopic?'confidante':'housekeeper';
  if(input.emotionalTopic&&input.mealCouldHelp)return 'both';
  if(input.emotionalTopic&&!input.practicalHouseholdNeed)return 'confidante';
  return 'housekeeper';
}

export function liaMayOfferDinnerBridge(input:{emotionalTopic:boolean;mealCouldCreateConnection:boolean;userRejectedMealHelp:boolean}){
  return input.emotionalTopic&&input.mealCouldCreateConnection&&!input.userRejectedMealHelp;
}
