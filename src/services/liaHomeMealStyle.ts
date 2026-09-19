import {parseLiaHomeMealStyleAnswer} from '../lib/liaHomeMealStyle';
import {saveLightMealHomeStyle,type LightHomeStyle} from './lightParticipation';

type PendingHomeStyle={
  questionId:string;
  householdId:string;
  mealDate:string;
  mealType:string;
  organizerName:string;
  demo:boolean;
};

export type LiaHomeMealStyleContinuation=
  |{status:'not_pending';spokenReply:null}
  |{status:'needs_clarification';spokenReply:string}
  |{status:'saved';style:LightHomeStyle;spokenReply:string}
  |{status:'skipped';spokenReply:string}
  |{status:'unavailable';spokenReply:string};

let pending:PendingHomeStyle|null=null;

function fr(languageTag:string):boolean{return languageTag.toLowerCase().startsWith('fr');}

export function beginLiaHomeMealStyleClarification(input:PendingHomeStyle):void{
  if(!input.questionId)return;
  pending={...input};
}
export function liaHomeMealStyleClarificationPending():boolean{return Boolean(pending);}
export function clearLiaHomeMealStyleClarification():void{pending=null;}

export function parseLiaHomeMealStyleAnswer(text:string):LightHomeStyle|'later'|null{
  const value=fold(text);
  if(!value)return null;
  if(/\b(attends?|attendre|autres|plus tard|pas maintenant|on verra|wait|later|not now|espera|mas tarde|אחר כך|נחכה)\b/.test(value))return'later';
  if(/\b(epater|impressionner|faire fort|faire quelque chose de special|quelque chose de special|grand jeu|gastro|wow|impress|special|show off|lucirse|impresionar|להרשים)\b/.test(value))return'impress';
  if(/\b(facile|simple|rapide|tranquille|sans prise de tete|pas prise de tete|easy|simple|quick|keep it easy|facil|rapido|sencillo|קל|פשוט|מהיר)\b/.test(value))return'easy';
  return null;
}

export async function continueLiaHomeMealStyleClarification(input:{text:string;languageTag:string}):Promise<LiaHomeMealStyleContinuation>{
  const current=pending;
  if(!current)return{status:'not_pending',spokenReply:null};
  const parsed=parseLiaHomeMealStyleAnswer(input.text);
  if(parsed==='later'){
    pending=null;
    return{status:'skipped',spokenReply:fr(input.languageTag)?'Ça marche. On attend les autres et on reprend ça plus tard.':'Sounds good. We’ll wait for the others and pick this up later.'};
  }
  if(!parsed){
    return{status:'needs_clarification',spokenReply:fr(input.languageTag)?'Tu préfères qu’on fasse facile, ou qu’on épate un peu la galerie ? Tu peux aussi me dire qu’on verra plus tard.':'Do you want to keep it easy, or make something that impresses everyone? You can also tell me to leave it for later.'};
  }
  try{
    if(!current.demo)await saveLightMealHomeStyle(current.questionId,parsed);
    pending=null;
    return parsed==='easy'
      ?{status:'saved',style:parsed,spokenReply:fr(input.languageTag)?'Parfait. Je garde “facile” pour ce repas. Quand les réponses sont rentrées, on cherchera quelque chose de simple et efficace.':'Perfect. I’ll keep “easy” for this meal. Once the replies are in, we’ll look for something simple and effective.'}
      :{status:'saved',style:parsed,spokenReply:fr(input.languageTag)?'Très bien 😏. Pour ce repas, on vise quelque chose qui fait son petit effet. On attend les autres et ensuite on choisit.':'Very good 😏. For this meal, we’ll aim for something with a bit of wow. We’ll wait for the others, then choose.'};
  }catch(error:any){
    pending=null;
    const code=String(error?.message??error);
    if(code.includes('QUESTION_TAKEN_OVER')){
      return{status:'skipped',spokenReply:fr(input.languageTag)?'Entre-temps, quelqu’un a pris le repas en charge. Je laisse donc cette personne gérer et je ne te relance pas dessus.':'In the meantime, someone took charge of the meal, so I’ll leave it with them and won’t keep nudging you about it.'};
    }
    return{status:'unavailable',spokenReply:fr(input.languageTag)?'Je n’ai pas pu garder ce choix pour le repas. Je préfère te le dire plutôt que faire semblant.':'I couldn’t save that choice for the meal. I’d rather tell you than pretend I did.'};
  }
}
