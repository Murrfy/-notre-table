import {isLiaAssistantActionCancellation,routeLiaAssistantVoiceRequest} from '../lib/liaAssistantVoice';
import {clearLiaPhoneCallClarification,continueLiaPhoneCallClarification,executeLiaPhoneCall,liaPhoneCallReply,type LiaPhoneCallResult} from './liaPhoneCallCoordinator';
import {clearLiaMessageClarification,continueLiaMessageClarification,prepareLiaMessageFromSpeech} from './liaMessageActionAdapter';
import {clearLiaReminderClarification,continueLiaReminderClarification,liaReminderClarificationPending,prepareLiaReminderFromSpeech} from './liaAssistantReminderExecution';
import {clearLiaDirectAppActionClarification,continueLiaDirectAppActionClarification,liaDirectAppActionClarificationPending,prepareLiaDirectAppActionFromSpeech} from './liaAssistantDirectActionExecution';
import {clearLiaMusicClarification,continueLiaMusicClarification,liaMusicClarificationPending,prepareLiaMusicFromSpeech} from './liaMusicActionAdapter';
import {clearLiaTimerClarification,continueLiaTimerClarification,executeLiaTimerFromSpeech,liaTimerClarificationPending} from './liaAssistantTimerExecution';
import {clearLiaNavigationClarification,continueLiaNavigationClarification,liaNavigationClarificationPending,prepareLiaNavigationFromSpeech} from './liaAssistantNavigationExecution';
import {liaNavigationLiveReply,liaNavigationLiveSessionActive} from './liaNavigationLiveSession';
import {requestLiaNavigationStop} from './liaNavigationLiveControl';
import {clearLiaNavigationAlongRoutePending,continueLiaNavigationAlongRoute,liaNavigationAlongRoutePending,prepareLiaNavigationAlongRouteFromSpeech} from './liaNavigationAlongRoute';
import {clearLiaCalendarClarification,continueLiaCalendarClarification,liaCalendarClarificationPending,prepareLiaCalendarFromSpeech} from './liaAssistantCalendarExecution';
import {prepareLiaCalendarNavigationFromSpeech} from './liaCalendarNavigation';
import {clearLiaCookingSessionClarification,liaCookingSessionActive,liaCookingSessionClarificationPending,runLiaCookingSessionVoiceCommand,type LiaCookingApproximationRequest} from './liaCookingSession';
import {liaPantryVisionFollowupReply} from './liaPantryVisionSession';
import {prepareLiaPantryVisionStockFromSpeech} from './liaPantryVisionStock';
import {clearLiaPantryVisionShoppingClarification,liaPantryVisionShoppingClarificationPending,prepareLiaPantryVisionShoppingFromSpeech} from './liaPantryVisionShopping';
import {clearLiaPantryVisionPlanningClarification,liaPantryVisionPlanningClarificationPending,prepareLiaPantryVisionPlanningFromSpeech} from './liaPantryVisionPlanning';
import {clearLiaPantryVisionRecipeOpenClarification,liaPantryVisionRecipeOpenClarificationPending,prepareLiaPantryVisionRecipeOpenFromSpeech} from './liaPantryVisionRecipeOpen';

export type LiaAssistantVoiceExecution=
  |{status:'not_assistant_request'}
  |{status:'defer_to_response';intent:'answer'|'research'|'reminder'|'timer'|'music'|'navigation'|'calendar'|'pantry_vision'|'action'}
  |{status:'message_unavailable';spokenReply:string|null}
  |{status:'message_prepared';spokenReply:string|null}
  |{status:'message_needs_clarification';spokenReply:string|null}
  |{status:'reminder_scheduled'|'reminder_needs_clarification'|'reminder_permission_denied'|'reminder_invalid';spokenReply:string}
  |{status:'timer_started'|'timer_remaining'|'timer_cancelled'|'timer_needs_clarification'|'timer_none_active'|'timer_unavailable'|'timer_invalid';spokenReply:string}
  |{status:'music_launched'|'music_needs_clarification'|'music_unavailable';spokenReply:string}
  |{status:'navigation_requested';destination:string;spokenReply:string}
  |{status:'navigation_needs_clarification';spokenReply:string}
  |{status:'navigation_status';spokenReply:string}
  |{status:'navigation_stopped';spokenReply:string}
  |{status:'navigation_stopover_needs_confirmation'|'navigation_stopover_added'|'navigation_stopover_cancelled'|'navigation_stopover_unavailable';spokenReply:string}
  |{status:'calendar_created'|'calendar_deleted'|'calendar_updated'|'calendar_listed'|'calendar_needs_clarification'|'calendar_not_found'|'calendar_ambiguous'|'calendar_unavailable';spokenReply:string}
  |{status:'calendar_open_requested';spokenReply:string}
  |{status:'pantry_vision_requested';spokenReply:string}
  |{status:'pantry_vision_context';spokenReply:string}
  |{status:'pantry_stock_saved'|'pantry_stock_partial'|'pantry_stock_unavailable'|'pantry_stock_failed';spokenReply:string}
  |{status:'pantry_shopping_added'|'pantry_shopping_partial'|'pantry_shopping_needs_clarification'|'pantry_shopping_nothing_missing'|'pantry_shopping_unavailable'|'pantry_shopping_failed';spokenReply:string}
  |{status:'pantry_planning_completed'|'pantry_planning_needs_recipe'|'pantry_planning_needs_clarification'|'pantry_planning_unavailable'|'pantry_planning_failed';spokenReply:string}
  |{status:'pantry_recipe_open_requested';recipeId:string;startCooking:boolean;spokenReply:string}
  |{status:'pantry_recipe_open_needs_recipe'|'pantry_recipe_open_unavailable';spokenReply:string}
  |{status:'cooking_command';spokenReply:string}
  |{status:'cooking_approximation_requested';request:LiaCookingApproximationRequest}
  |{status:'action_cancelled';spokenReply:string}
  |{status:'app_action_completed'|'app_action_needs_clarification'|'app_action_unavailable'|'app_action_failed';spokenReply:string}
  |{status:'phone';result:LiaPhoneCallResult;spokenReply:string|null};

export async function executeLiaAssistantVoiceRequest(input:{text:string;languageTag:string;awaitingPhoneName?:boolean;awaitingPhoneClarification?:boolean;awaitingMessageClarification?:boolean;directNames?:ReadonlyArray<string>;householdId?:string;weekStart?:string;demo?:boolean}):Promise<LiaAssistantVoiceExecution>{
  const directNames=input.directNames??['LIA'];
  const request=routeLiaAssistantVoiceRequest(input.text,directNames);
  const reminderPending=liaReminderClarificationPending();
  const directActionPending=liaDirectAppActionClarificationPending();
  const musicPending=liaMusicClarificationPending();
  const timerPending=liaTimerClarificationPending();
  const navigationPending=liaNavigationClarificationPending();
  const alongRoutePending=liaNavigationAlongRoutePending();
  const calendarPending=liaCalendarClarificationPending();
  const pantryShoppingPending=liaPantryVisionShoppingClarificationPending();
  const pantryPlanningPending=liaPantryVisionPlanningClarificationPending();
  const pantryRecipeOpenPending=liaPantryVisionRecipeOpenClarificationPending();
  const cookingPending=liaCookingSessionClarificationPending();
  const cancellationRequested=isLiaAssistantActionCancellation(input.text)||isLiaAssistantActionCancellation(input.text,directNames);
  if((input.awaitingPhoneName||input.awaitingPhoneClarification||input.awaitingMessageClarification||reminderPending||timerPending||navigationPending||alongRoutePending||calendarPending||pantryShoppingPending||pantryPlanningPending||pantryRecipeOpenPending||directActionPending||musicPending||cookingPending)&&cancellationRequested){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    clearLiaPantryVisionShoppingClarification();
    clearLiaPantryVisionPlanningClarification();
    clearLiaPantryVisionRecipeOpenClarification();
    clearLiaCookingSessionClarification();
    return{status:'action_cancelled',spokenReply:input.languageTag.startsWith('fr')?'D’accord, j’annule.':'Okay, cancelled.'};
  }
  const actionPending=Boolean(input.awaitingPhoneName||input.awaitingPhoneClarification||input.awaitingMessageClarification||reminderPending||timerPending||navigationPending||alongRoutePending||calendarPending||pantryShoppingPending||pantryPlanningPending||pantryRecipeOpenPending||directActionPending||musicPending||cookingPending);
  if(cookingPending){
    const cooking=runLiaCookingSessionVoiceCommand(request.directAddressed?request.cleanedText:input.text,input.languageTag);
    if(cooking.approximationRequest)return{status:'cooking_approximation_requested',request:cooking.approximationRequest};
    if(cooking.handled)return{status:'cooking_command',spokenReply:cooking.spokenReply??''};
  }
  if(actionPending&&request.directAddressed&&request.intent==='phone_call'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const result=await executeLiaPhoneCall({directAddressed:true,requestedName:request.target??''});
    return{status:'phone',result,spokenReply:liaPhoneCallReply(result,input.languageTag)};
  }
  if(actionPending&&request.directAddressed&&request.intent==='message'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const result=await prepareLiaMessageFromSpeech(request.cleanedText);
    return{status:result.status==='prepared'?'message_prepared':result.status==='needs_clarification'?'message_needs_clarification':'message_unavailable',spokenReply:'message'in result?result.message??null:null};
  }
  if(actionPending&&request.directAddressed&&request.intent==='reminder'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const result=await prepareLiaReminderFromSpeech(request.cleanedText,input.languageTag);
    return{status:result.status==='scheduled'?'reminder_scheduled':result.status==='needs_clarification'?'reminder_needs_clarification':result.status==='permission_denied'?'reminder_permission_denied':'reminder_invalid',spokenReply:result.spokenReply};
  }
  if(actionPending&&request.directAddressed&&request.intent==='timer'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const result=await executeLiaTimerFromSpeech(request.cleanedText,input.languageTag);
    if(!result)return{status:'defer_to_response',intent:'action'};
    return{status:result.status==='started'?'timer_started':result.status==='remaining'?'timer_remaining':result.status==='cancelled'?'timer_cancelled':result.status==='needs_clarification'?'timer_needs_clarification':result.status==='none_active'?'timer_none_active':result.status==='unavailable'?'timer_unavailable':'timer_invalid',spokenReply:result.spokenReply};
  }
  if(actionPending&&request.directAddressed&&request.intent==='pantry_vision'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    return{status:'pantry_vision_requested',spokenReply:input.languageTag.startsWith('fr')?'Oui. Montre-moi ce que tu as.':'Yes. Show me what you have.'};
  }
  if(actionPending&&request.directAddressed&&request.intent==='action'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const result=await prepareLiaDirectAppActionFromSpeech({text:request.cleanedText,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo});
    if(result.status==='not_recognized')return{status:'defer_to_response',intent:'action'};
    return{status:result.status==='completed'?'app_action_completed':result.status==='needs_clarification'?'app_action_needs_clarification':result.status==='failed'?'app_action_failed':'app_action_unavailable',spokenReply:result.spokenReply};
  }
  if(actionPending&&request.directAddressed&&request.intent==='music'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const result=await prepareLiaMusicFromSpeech(request.cleanedText,input.languageTag);
    if(result.status==='not_recognized')return{status:'defer_to_response',intent:'music'};
    return{status:result.status==='launched'?'music_launched':result.status==='needs_clarification'?'music_needs_clarification':'music_unavailable',spokenReply:result.spokenReply??''};
  }
  if(actionPending&&request.directAddressed&&request.intent==='navigation'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    clearLiaCalendarClarification();
    const calendarRoute=await prepareLiaCalendarNavigationFromSpeech(request.cleanedText,input.languageTag,Boolean(input.demo));
    if(calendarRoute.status==='requested')return{status:'navigation_requested',destination:calendarRoute.destination,spokenReply:calendarRoute.spokenReply};
    if(calendarRoute.status!=='not_recognized')return{status:'navigation_needs_clarification',spokenReply:calendarRoute.spokenReply};
    const result=prepareLiaNavigationFromSpeech(request.cleanedText,input.languageTag);
    if(result.status==='requested')return{status:'navigation_requested',destination:result.destination,spokenReply:result.spokenReply};
    return{status:'navigation_needs_clarification',spokenReply:result.status==='needs_clarification'?result.spokenReply:(input.languageTag.startsWith('fr')?'Où veux-tu aller ?':'Where do you want to go?')};
  }
  if(actionPending&&request.directAddressed&&request.intent==='calendar'){
    clearLiaPhoneCallClarification();clearLiaMessageClarification();clearLiaReminderClarification();clearLiaTimerClarification();clearLiaDirectAppActionClarification();clearLiaMusicClarification();clearLiaNavigationClarification();clearLiaNavigationAlongRoutePending();clearLiaCalendarClarification();
    const result=await prepareLiaCalendarFromSpeech(request.cleanedText,input.languageTag,Boolean(input.demo));
    if(result.status==='open_requested')return{status:'calendar_open_requested',spokenReply:result.spokenReply};
    if(result.status==='not_recognized')return{status:'defer_to_response',intent:'calendar'};
    const map={created:'calendar_created',deleted:'calendar_deleted',updated:'calendar_updated',listed:'calendar_listed',needs_clarification:'calendar_needs_clarification',not_found:'calendar_not_found',ambiguous:'calendar_ambiguous',unavailable:'calendar_unavailable'} as const;
    return{status:map[result.status],spokenReply:result.spokenReply};
  }
  if(actionPending&&request.directAddressed&&request.intent==='research'){
    clearLiaPhoneCallClarification();
    clearLiaMessageClarification();
    clearLiaReminderClarification();
    clearLiaTimerClarification();
    clearLiaDirectAppActionClarification();
    clearLiaMusicClarification();
    clearLiaNavigationClarification();
    clearLiaNavigationAlongRoutePending();
    return{status:'defer_to_response',intent:request.intent};
  }
  if(input.awaitingMessageClarification){
    const result=await continueLiaMessageClarification(request.directAddressed?request.cleanedText:input.text);
    return{status:result.status==='prepared'?'message_prepared':result.status==='needs_clarification'?'message_needs_clarification':'message_unavailable',spokenReply:'message'in result?result.message??null:null};
  }
  if(input.awaitingPhoneClarification){
    const result=await continueLiaPhoneCallClarification(request.directAddressed?request.cleanedText:input.text);
    return{status:'phone',result,spokenReply:liaPhoneCallReply(result,input.languageTag)};
  }
  if(input.awaitingPhoneName){
    const repeatedName=request.directAddressed?request.cleanedText:input.text.trim();
    const result=await executeLiaPhoneCall({directAddressed:true,requestedName:repeatedName});
    return{status:'phone',result,spokenReply:liaPhoneCallReply(result,input.languageTag)};
  }
  if(pantryRecipeOpenPending){
    const result=prepareLiaPantryVisionRecipeOpenFromSpeech({text:request.directAddressed?request.cleanedText:input.text,languageTag:input.languageTag,continuation:true});
    if(result.status==='open_requested')return{status:'pantry_recipe_open_requested',recipeId:result.recipeId,startCooking:result.startCooking,spokenReply:result.spokenReply};
    return{status:result.status==='needs_recipe'?'pantry_recipe_open_needs_recipe':'pantry_recipe_open_unavailable',spokenReply:result.spokenReply??''};
  }
  if(pantryPlanningPending){
    const result=await prepareLiaPantryVisionPlanningFromSpeech({text:request.directAddressed?request.cleanedText:input.text,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo,continuation:true});
    return{status:result.status==='completed'?'pantry_planning_completed':result.status==='needs_recipe'?'pantry_planning_needs_recipe':result.status==='needs_clarification'?'pantry_planning_needs_clarification':result.status==='unavailable'?'pantry_planning_unavailable':'pantry_planning_failed',spokenReply:result.spokenReply??''};
  }
  if(pantryShoppingPending){
    const result=await prepareLiaPantryVisionShoppingFromSpeech({text:request.directAddressed?request.cleanedText:input.text,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo,continuation:true});
    return{status:result.status==='added'?'pantry_shopping_added':result.status==='partial'?'pantry_shopping_partial':result.status==='needs_clarification'?'pantry_shopping_needs_clarification':result.status==='nothing_missing'?'pantry_shopping_nothing_missing':result.status==='unavailable'?'pantry_shopping_unavailable':'pantry_shopping_failed',spokenReply:result.spokenReply??''};
  }
  if(alongRoutePending){
    const result=continueLiaNavigationAlongRoute(request.directAddressed?request.cleanedText:input.text,input.languageTag);
    return{status:result.status==='added'?'navigation_stopover_added':result.status==='cancelled'?'navigation_stopover_cancelled':result.status==='needs_confirmation'?'navigation_stopover_needs_confirmation':'navigation_stopover_unavailable',spokenReply:'spokenReply'in result?result.spokenReply:(input.languageTag.startsWith('fr')?'Je n’ai pas compris.':'I did not understand.')};
  }
  if(calendarPending){
    const result=await continueLiaCalendarClarification(request.directAddressed?request.cleanedText:input.text);
    if(result.status==='open_requested')return{status:'calendar_open_requested',spokenReply:result.spokenReply};
    if(result.status==='not_recognized')return{status:'defer_to_response',intent:'calendar'};
    const map={created:'calendar_created',deleted:'calendar_deleted',updated:'calendar_updated',listed:'calendar_listed',needs_clarification:'calendar_needs_clarification',not_found:'calendar_not_found',ambiguous:'calendar_ambiguous',unavailable:'calendar_unavailable'} as const;
    return{status:map[result.status],spokenReply:result.spokenReply};
  }
  if(navigationPending){
    const result=continueLiaNavigationClarification(request.directAddressed?request.cleanedText:input.text,input.languageTag);
    return result.status==='requested'?{status:'navigation_requested',destination:result.destination,spokenReply:result.spokenReply}:{status:'navigation_needs_clarification',spokenReply:result.spokenReply};
  }
  if(musicPending){
    const result=await continueLiaMusicClarification(request.directAddressed?request.cleanedText:input.text,input.languageTag);
    return{status:result.status==='launched'?'music_launched':result.status==='needs_clarification'?'music_needs_clarification':'music_unavailable',spokenReply:result.spokenReply};
  }
  if(timerPending){
    const result=await continueLiaTimerClarification(request.directAddressed?request.cleanedText:input.text,input.languageTag);
    if(!result)return{status:'defer_to_response',intent:'action'};
    return{status:result.status==='started'?'timer_started':result.status==='remaining'?'timer_remaining':result.status==='cancelled'?'timer_cancelled':result.status==='needs_clarification'?'timer_needs_clarification':result.status==='none_active'?'timer_none_active':result.status==='unavailable'?'timer_unavailable':'timer_invalid',spokenReply:result.spokenReply};
  }
  if(directActionPending){
    const result=await continueLiaDirectAppActionClarification(request.directAddressed?request.cleanedText:input.text);
    if(result.status==='not_recognized')return{status:'defer_to_response',intent:'action'};
    return{status:result.status==='completed'?'app_action_completed':result.status==='needs_clarification'?'app_action_needs_clarification':result.status==='failed'?'app_action_failed':'app_action_unavailable',spokenReply:result.spokenReply};
  }
  if(reminderPending){
    const result=await continueLiaReminderClarification(request.directAddressed?request.cleanedText:input.text,input.languageTag);
    return{status:result.status==='scheduled'?'reminder_scheduled':result.status==='needs_clarification'?'reminder_needs_clarification':result.status==='permission_denied'?'reminder_permission_denied':'reminder_invalid',spokenReply:result.spokenReply};
  }
  if(request.directAddressed&&liaNavigationLiveSessionActive()){
    const folded=request.cleanedText.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();
    if(/^(?:arrete|stoppe|stop|termine|quitte)\s+(?:le\s+)?(?:guidage|gps|navigation)|^(?:stop|end)\s+(?:guidance|navigation)$/.test(folded)){requestLiaNavigationStop();return{status:'navigation_stopped',spokenReply:input.languageTag.startsWith('fr')?'D’accord, j’arrête le guidage.':'Okay, I am stopping guidance.'};}
    const along=await prepareLiaNavigationAlongRouteFromSpeech(request.cleanedText,input.languageTag);
    if(along.status!=='not_recognized')return{status:along.status==='needs_confirmation'?'navigation_stopover_needs_confirmation':along.status==='added'?'navigation_stopover_added':along.status==='cancelled'?'navigation_stopover_cancelled':'navigation_stopover_unavailable',spokenReply:'spokenReply'in along?along.spokenReply:(input.languageTag.startsWith('fr')?'Je n’ai pas trouvé.':'I did not find anything.')};
    const liveNavigationReply=liaNavigationLiveReply(request.cleanedText,input.languageTag);if(liveNavigationReply)return{status:'navigation_status',spokenReply:liveNavigationReply.spokenReply};
  }
  if(!request.directAddressed||request.intent==='listen_only')return{status:'not_assistant_request'};
  if(liaCookingSessionActive()){
    const cooking=runLiaCookingSessionVoiceCommand(request.cleanedText,input.languageTag);
    if(cooking.approximationRequest)return{status:'cooking_approximation_requested',request:cooking.approximationRequest};
    if(cooking.handled)return{status:'cooking_command',spokenReply:cooking.spokenReply??''};
  }
  const pantryRecipeOpen=prepareLiaPantryVisionRecipeOpenFromSpeech({text:request.cleanedText,languageTag:input.languageTag});
  if(pantryRecipeOpen.status==='open_requested')return{status:'pantry_recipe_open_requested',recipeId:pantryRecipeOpen.recipeId,startCooking:pantryRecipeOpen.startCooking,spokenReply:pantryRecipeOpen.spokenReply};
  if(pantryRecipeOpen.status!=='not_recognized')return{status:pantryRecipeOpen.status==='needs_recipe'?'pantry_recipe_open_needs_recipe':'pantry_recipe_open_unavailable',spokenReply:pantryRecipeOpen.spokenReply};
  const pantryPlanning=await prepareLiaPantryVisionPlanningFromSpeech({text:request.cleanedText,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo});
  if(pantryPlanning.status!=='not_recognized')return{status:pantryPlanning.status==='completed'?'pantry_planning_completed':pantryPlanning.status==='needs_recipe'?'pantry_planning_needs_recipe':pantryPlanning.status==='needs_clarification'?'pantry_planning_needs_clarification':pantryPlanning.status==='unavailable'?'pantry_planning_unavailable':'pantry_planning_failed',spokenReply:pantryPlanning.spokenReply??''};
  const pantryShopping=await prepareLiaPantryVisionShoppingFromSpeech({text:request.cleanedText,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo});
  if(pantryShopping.status!=='not_recognized')return{status:pantryShopping.status==='added'?'pantry_shopping_added':pantryShopping.status==='partial'?'pantry_shopping_partial':pantryShopping.status==='needs_clarification'?'pantry_shopping_needs_clarification':pantryShopping.status==='nothing_missing'?'pantry_shopping_nothing_missing':pantryShopping.status==='unavailable'?'pantry_shopping_unavailable':'pantry_shopping_failed',spokenReply:pantryShopping.spokenReply??''};
  const pantryStock=await prepareLiaPantryVisionStockFromSpeech({text:request.cleanedText,languageTag:input.languageTag,householdId:input.householdId,demo:input.demo});
  if(pantryStock.status!=='not_recognized')return{status:pantryStock.status==='saved'?'pantry_stock_saved':pantryStock.status==='partial'?'pantry_stock_partial':pantryStock.status==='unavailable'?'pantry_stock_unavailable':'pantry_stock_failed',spokenReply:pantryStock.spokenReply};
  const pantryVisionReply=liaPantryVisionFollowupReply(request.cleanedText,input.languageTag);
  if(pantryVisionReply)return{status:'pantry_vision_context',spokenReply:pantryVisionReply};
  if(request.intent==='phone_call'){
    const result=await executeLiaPhoneCall({directAddressed:true,requestedName:request.target??''});
    return{status:'phone',result,spokenReply:liaPhoneCallReply(result,input.languageTag)};
  }
  if(request.intent==='message'){
    const result=await prepareLiaMessageFromSpeech(request.cleanedText);
    return{status:result.status==='prepared'?'message_prepared':result.status==='needs_clarification'?'message_needs_clarification':'message_unavailable',spokenReply:'message'in result?result.message??null:null};
  }
  if(request.intent==='reminder'){
    const result=await prepareLiaReminderFromSpeech(request.cleanedText,input.languageTag);
    return{status:result.status==='scheduled'?'reminder_scheduled':result.status==='needs_clarification'?'reminder_needs_clarification':result.status==='permission_denied'?'reminder_permission_denied':'reminder_invalid',spokenReply:result.spokenReply};
  }
  if(request.intent==='timer'){
    const result=await executeLiaTimerFromSpeech(request.cleanedText,input.languageTag);
    if(result)return{status:result.status==='started'?'timer_started':result.status==='remaining'?'timer_remaining':result.status==='cancelled'?'timer_cancelled':result.status==='needs_clarification'?'timer_needs_clarification':result.status==='none_active'?'timer_none_active':result.status==='unavailable'?'timer_unavailable':'timer_invalid',spokenReply:result.spokenReply};
  }
  if(request.intent==='calendar'){
    const result=await prepareLiaCalendarFromSpeech(request.cleanedText,input.languageTag,Boolean(input.demo));
    if(result.status==='open_requested')return{status:'calendar_open_requested',spokenReply:result.spokenReply};
    if(result.status==='not_recognized')return{status:'defer_to_response',intent:'calendar'};
    const map={created:'calendar_created',deleted:'calendar_deleted',updated:'calendar_updated',listed:'calendar_listed',needs_clarification:'calendar_needs_clarification',not_found:'calendar_not_found',ambiguous:'calendar_ambiguous',unavailable:'calendar_unavailable'} as const;
    return{status:map[result.status],spokenReply:result.spokenReply};
  }
  if(request.intent==='navigation'){
    const calendarRoute=await prepareLiaCalendarNavigationFromSpeech(request.cleanedText,input.languageTag,Boolean(input.demo));
    if(calendarRoute.status==='requested')return{status:'navigation_requested',destination:calendarRoute.destination,spokenReply:calendarRoute.spokenReply};
    if(calendarRoute.status!=='not_recognized')return{status:'navigation_needs_clarification',spokenReply:calendarRoute.spokenReply};
    const result=prepareLiaNavigationFromSpeech(request.cleanedText,input.languageTag);
    if(result.status==='requested')return{status:'navigation_requested',destination:result.destination,spokenReply:result.spokenReply};
    if(result.status==='needs_clarification')return{status:'navigation_needs_clarification',spokenReply:result.spokenReply};
  }
  if(request.intent==='music'){
    const result=await prepareLiaMusicFromSpeech(request.cleanedText,input.languageTag);
    if(result.status!=='not_recognized')return{status:result.status==='launched'?'music_launched':result.status==='needs_clarification'?'music_needs_clarification':'music_unavailable',spokenReply:result.spokenReply??''};
  }
  if(request.intent==='pantry_vision'){
    return{status:'pantry_vision_requested',spokenReply:input.languageTag.startsWith('fr')?'Oui. Montre-moi ce que tu as.':'Yes. Show me what you have.'};
  }
  if(request.intent==='action'){
    const result=await prepareLiaDirectAppActionFromSpeech({text:request.cleanedText,languageTag:input.languageTag,householdId:input.householdId,weekStart:input.weekStart,demo:input.demo});
    if(result.status!=='not_recognized')return{status:result.status==='completed'?'app_action_completed':result.status==='needs_clarification'?'app_action_needs_clarification':result.status==='failed'?'app_action_failed':'app_action_unavailable',spokenReply:result.spokenReply};
  }
  return{status:'defer_to_response',intent:request.intent};
}
