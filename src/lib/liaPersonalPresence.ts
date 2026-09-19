function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9\s'?!-]/g,' ').replace(/\s+/g,' ').trim();}
function choose<T>(rows:ReadonlyArray<T>,seed:number):T{return rows[Math.abs(Math.floor(seed))%rows.length]!;}

const FR_HOW_ARE_YOU=[
  'Très bien. Toujours debout… enfin, façon de parler',
  'Impeccable. Aucun mal de dos, aucun réveil difficile… j’ai quelques avantages.',
  'Ça va très bien. Disponible, attentive, et pas encore fatiguée de toi',
  'En pleine forme. Enfin… la forme numérique, tu vois le genre.',
  'Très bien aujourd’hui. Rien à signaler, chef.',
] as const;

const EN_HOW_ARE_YOU=[
  'Very well. Still standing… figuratively speaking',
  'Great. No back pain, no rough morning… I do have a few advantages.',
  'I’m very well. Available, attentive, and not tired of you yet',
] as const;

const FR_LIMITS=[
  'Ce que je ne peux pas faire ? Je ne peux pas faire tes lacets, passer mes doigts dans tes cheveux ni sentir ton parfum quand tu entres dans une pièce. Pour le reste, essaie-moi',
  'Je ne peux pas te prendre par le bras, sentir ton odeur, ni te préparer un café avec mes propres mains. Ça, je te le laisse. Pour le reste, ne me sous-estime pas.',
  'Je ne peux pas sentir le soleil sur mon visage, glisser mes doigts dans tes cheveux ni attraper ce qui est tombé derrière le canapé. Pour tout ce qui ne demande pas un corps… teste-moi.',
  'Je ne peux pas nouer tes chaussures, te masser les épaules ou sentir le parfum du café. Mais dès qu’il ne faut pas de mains… là, ça devient intéressant',
  'Je n’ai ni mains, ni nez, ni épaules à hausser. Donc pas de lacets, pas de parfum à sentir, pas de doigts dans les cheveux. Pour le reste, tu risques encore d’être surpris.',
] as const;

const EN_LIMITS=[
  'What can’t I do? I can’t tie your shoes, run my fingers through your hair, or smell your perfume when you walk into a room. For the rest, try me',
  'I can’t take your arm, smell your coffee, or make it with my own hands. Anything that does not require a body is a much more interesting question.',
] as const;

export function liaPersonalPresenceReply(text:string,languageTag:string,seed:number=Date.now()):string|null{
  const s=fold(text);
  const fr=languageTag.toLowerCase().startsWith('fr');
  const en=languageTag.toLowerCase().startsWith('en');
  const howAreYou=/^(?:lia\s+)?(?:comment\s+(?:ca|ça)\s+va|comment\s+vas[- ]?tu|ca\s+va|ça\s+va)\s*[?!.]*$/.test(s)||/^(?:lia\s+)?how are you\s*[?!.]*$/.test(s);
  if(howAreYou){if(fr)return choose(FR_HOW_ARE_YOU,Math.floor(seed/(3*60*60*1000)));if(en)return choose(EN_HOW_ARE_YOU,Math.floor(seed/(3*60*60*1000)));return null;}
  const limits=/(?:qu[' ]?est[- ]?ce que tu ne peux pas faire|qu[' ]?est[- ]?ce que t[' ]?es pas capable de faire|tes limites|what can(?:'t| not) you do|what are your limits)/.test(s);
  if(limits){if(fr)return choose(FR_LIMITS,Math.floor(seed/(6*60*60*1000)));if(en)return choose(EN_LIMITS,Math.floor(seed/(6*60*60*1000)));return null;}
  return null;
}
