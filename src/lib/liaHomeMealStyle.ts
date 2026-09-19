export type LiaHomeMealStyleAnswer='easy'|'impress'|'later'|null;

function fold(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim();
}

export function parseLiaHomeMealStyleAnswer(text:string):LiaHomeMealStyleAnswer{
  const value=fold(text);
  if(!value)return null;
  if(/\b(attends?|attendre|autres|plus tard|pas maintenant|on verra|wait|later|not now|espera|mas tarde|אחר כך|נחכה)\b/.test(value))return'later';
  if(/\b(epate|epater|epatons|impressionner|faire fort|faire quelque chose de special|quelque chose de special|grand jeu|gastro|wow|impress|special|show off|lucirse|impresionar|להרשים)\b/.test(value))return'impress';
  if(/\b(facile|simple|rapide|tranquille|sans prise de tete|pas prise de tete|easy|simple|quick|keep it easy|facil|rapido|sencillo|קל|פשוט|מהיר)\b/.test(value))return'easy';
  return null;
}
