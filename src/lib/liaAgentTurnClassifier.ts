import type {LiaAgentTask} from './liaAgentRouting';

export type LiaAgentTurnClassification={
  task:LiaAgentTask;
  sensitive:boolean;
  reason:'current_information'|'complex_request'|'private_topic'|'ordinary_conversation';
};

function fold(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
}

const CURRENT_INFORMATION=/(?:\b(?:cherche|recherche|verifie|trouve sur internet|sur le web|actualite|dernieres nouvelles|meteo|cours actuel|prix actuel|est[- ]ce ouvert|ouvert maintenant|horaires? aujourd'hui|look up|search|check online|latest|current price|weather|open now|today's? hours)\b|(?:חפש|בדוק|חדשות|מזג אוויר|מחיר נוכחי|פתוח עכשיו))/i;
const COMPLEX_REQUEST=/(?:\b(?:analyse|compare|comparaison|explique[- ]moi pourquoi|aide[- ]moi a choisir|aide[- ]moi a decider|fais[- ]moi un plan|quelles options|avantages? et inconvenients?|strategie|raisonne|analy[sz]e|compare|help me (?:choose|decide)|make (?:me )?a plan|pros and cons|strategy)\b|(?:נתח|השווה|תוכנית|יתרונות וחסרונות))/i;
const MUSIC_FACT=/(?:\b(?:anecdote|histoire sur (?:ce|cette) (?:chanteur|chanteuse|groupe|morceau)|raconte[- ]moi (?:un truc|quelque chose) sur (?:ce|cette) (?:chanteur|chanteuse|groupe)|qui chante|c['’]est qui (?:le|la) chanteur|tu sais quoi sur (?:ce|cette) (?:chanteur|chanteuse|groupe))\b|(?:anecdote about|tell me something about (?:this|the) (?:artist|singer|band|song)|who sings this))/i;
const PRIVATE_TOPIC=/(?:\b(?:cancer|maladie|diagnostic|traitement medical|medicament|douleur|depression|suicide|enceinte|grossesse|sexualite|relation sexuelle|divorce|separation|me trompe|te trompe|infidelite|dispute de couple|secret de famille|dette|compte bancaire|carte bancaire|salaire|avocat|proces|medical treatment|diagnosis|medication|pregnan(?:t|cy)|sexual|divorce|cheat(?:ing)?|family secret|bank account|credit card|salary|lawyer|lawsuit)\b|(?:סרטן|מחלה|אבחון|תרופה|הריון|גירושין|חשבון בנק|עורך דין))/i;

export function classifyLiaAgentTurn(text:string):LiaAgentTurnClassification{
  const clean=fold(text);
  const sensitive=PRIVATE_TOPIC.test(clean);
  if(CURRENT_INFORMATION.test(clean))return{task:'verified_research',sensitive,reason:sensitive?'private_topic':'current_information'};
  if(MUSIC_FACT.test(clean))return{task:'verified_research',sensitive,reason:sensitive?'private_topic':'current_information'};
  if(COMPLEX_REQUEST.test(clean))return{task:'complex_reasoning',sensitive,reason:sensitive?'private_topic':'complex_request'};
  return{task:'simple_conversation',sensitive,reason:sensitive?'private_topic':'ordinary_conversation'};
}
