export type LiaAgentFailureStatus='unavailable'|'deferred_cost_guard'|'empty'|'unverified'|'local_action_required'|'timed_out'|'provider_error';

const replies={
  fr:{
    unavailable:'Je n’arrive pas à te répondre correctement pour le moment.',
    deferred_cost_guard:'Je ne peux pas vérifier ça maintenant.',
    empty:'Je n’ai pas une réponse assez claire. Reformule-moi ça.',
    unverified:'Je n’ai pas trouvé de source assez sûre pour te répondre.',
    timed_out:'Ça prend trop de temps. Je préfère ne pas t’inventer une réponse.',
    provider_error:'Je n’arrive pas à te répondre correctement pour le moment.',
  },
  en:{
    unavailable:'I can’t give you a reliable answer right now.',
    deferred_cost_guard:'I can’t verify that right now.',
    empty:'I don’t have a clear enough answer. Ask me another way.',
    unverified:'I couldn’t find a reliable enough source to answer you.',
    timed_out:'This is taking too long. I’d rather not invent an answer.',
    provider_error:'I can’t give you a reliable answer right now.',
  },
  es:{
    unavailable:'Ahora mismo no consigo responderte correctamente.',
    deferred_cost_guard:'No puedo verificarlo ahora mismo.',
    empty:'No tengo una respuesta suficientemente clara. Dímelo de otra manera.',
    unverified:'No he encontrado una fuente suficientemente fiable para responderte.',
    timed_out:'Está tardando demasiado. Prefiero no inventar una respuesta.',
    provider_error:'Ahora mismo no consigo responderte correctamente.',
  },
  he:{
    unavailable:'כרגע אני לא מצליחה לענות לך כמו שצריך.',
    deferred_cost_guard:'אני לא יכולה לאמת את זה כרגע.',
    empty:'אין לי תשובה מספיק ברורה. אפשר לנסח את זה אחרת?',
    unverified:'לא מצאתי מקור מספיק אמין כדי לענות לך.',
    timed_out:'זה לוקח יותר מדי זמן. אני מעדיפה לא להמציא תשובה.',
    provider_error:'כרגע אני לא מצליחה לענות לך כמו שצריך.',
  },
} as const;

export function liaAgentFailureReply(status:LiaAgentFailureStatus,languageTag:string):string|null{
  if(status==='local_action_required')return null;
  const base=languageTag.split('-')[0]?.toLowerCase();
  const language=base==='fr'||base==='es'||base==='he'?base:'en';
  return replies[language][status];
}
