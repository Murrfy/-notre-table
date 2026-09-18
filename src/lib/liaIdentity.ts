export const LIA_CANONICAL_NAME='LIA' as const;

export type LiaNamingContext={
  liaNickname:string|null;
  userNickname:string|null;
  userNicknameApproved:boolean;
};

export const DEFAULT_LIA_NAMING_CONTEXT:LiaNamingContext={
  liaNickname:null,
  userNickname:null,
  userNicknameApproved:false,
};

function cleanSpaces(value:string):string{return value.trim().replace(/\s+/g,' ');}
function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function escapeRegExp(value:string):string{return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

/** Nicknames stay short, human-readable and deliberately boring at the storage boundary. */
export function sanitizeLiaNickname(value:string):string|null{
  const cleaned=cleanSpaces(value).replace(/^["“”'‘’.,;:!?-]+|["“”'‘’.,;:!?-]+$/g,'').trim();
  if(!cleaned||cleaned.length>24)return null;
  if(cleaned.split(' ').length>3)return null;
  if(!/^[\p{L}\p{N}][\p{L}\p{N}'’_-]*(?: [\p{L}\p{N}][\p{L}\p{N}'’_-]*){0,2}$/u.test(cleaned))return null;
  return cleaned;
}

export function liaDirectAddressNames(liaNickname:string|null):string[]{
  const nickname=sanitizeLiaNickname(liaNickname??'');
  const names:string[]=[LIA_CANONICAL_NAME];
  if(nickname&&fold(nickname)!==fold(LIA_CANONICAL_NAME))names.push(nickname);
  return names;
}

export function stripLiaKnownDirectName(text:string,names:ReadonlyArray<string>=['LIA']):{directAddressed:boolean;cleanedText:string;usedName:string|null}{
  const raw=text.trim();
  for(const name of names){
    const cleanName=sanitizeLiaNickname(name);
    if(!cleanName)continue;
    const pattern=new RegExp(`^(?:hey\\s+|salut\\s+|dis\\s+)?${escapeRegExp(cleanName)}(?:\\s*[,;:!?.-]\\s*|\\s+)(.*)$`,'iu');
    const match=raw.match(pattern);
    if(match){
      const cleanedText=(match[1]??'').trim();
      return{directAddressed:true,cleanedText,usedName:cleanName};
    }
  }
  return{directAddressed:false,cleanedText:raw,usedName:null};
}

export function liaStartsWithKnownDirectName(text:string,names:ReadonlyArray<string>=['LIA']):boolean{
  const raw=text.trim();
  return names.some(name=>{
    const cleanName=sanitizeLiaNickname(name);if(!cleanName)return false;
    return new RegExp(`^(?:hey\\s+|salut\\s+|dis\\s+)?${escapeRegExp(cleanName)}(?:\\b|\\s*[,;:!?.-])`,'iu').test(raw);
  });
}

export function liaAskedHerName(text:string,names:ReadonlyArray<string>=['LIA']):boolean{
  const direct=stripLiaKnownDirectName(text,names);
  const s=fold(direct.cleanedText).replace(/['’]/g,' ').replace(/[?!.,;:]+/g,' ').replace(/\s+/g,' ').trim();
  return /^(?:comment tu t appelles|quel est ton prenom|c est quoi ton prenom|what is your name|what s your name|como te llamas|cual es tu nombre)$/.test(s)
    || /^(?:איך קוראים לך|מה השם שלך)$/.test(direct.cleanedText.trim());
}

export function extractProposedLiaNickname(text:string,names:ReadonlyArray<string>=['LIA']):string|null{
  const direct=stripLiaKnownDirectName(text,names);
  if(!direct.directAddressed)return null;
  const raw=direct.cleanedText.trim();
  const patterns=[
    /^(?:je (?:vais |veux )?t['’ ]appeler|je t['’ ]appelle|ton surnom (?:sera|c['’ ]est)|est[- ]ce que je peux t['’ ]appeler|je peux t['’ ]appeler)\s+(.+?)[.!?]*$/iu,
    /^(?:i(?:'m going to| will| want to)? call you|your nickname (?:is|will be)|can i call you)\s+(.+?)[.!?]*$/iu,
    /^(?:te (?:voy a )?llamar|quiero llamarte|tu apodo (?:es|sera)|puedo llamarte)\s+(.+?)[.!?]*$/iu,
    /^(?:אני (?:אקרא|רוצה לקרוא) לך|אפשר לקרוא לך|הכינוי שלך הוא)\s+(.+?)[.!?]*$/u,
  ];
  for(const pattern of patterns){const match=raw.match(pattern);const candidate=sanitizeLiaNickname(match?.[1]??'');if(candidate)return candidate;}
  return null;
}

export function extractApprovedUserNickname(text:string,names:ReadonlyArray<string>=['LIA']):string|null{
  const direct=stripLiaKnownDirectName(text,names);
  if(!direct.directAddressed)return null;
  const raw=direct.cleanedText.trim();
  const patterns=[
    /^(?:appelle[- ]moi|tu peux m['’ ]appeler|je veux que tu m['’ ]appelles)\s+(.+?)[.!?]*$/iu,
    /^(?:call me|you can call me|i want you to call me)\s+(.+?)[.!?]*$/iu,
    /^(?:llamame|llámame|puedes llamarme|quiero que me llames)\s+(.+?)[.!?]*$/iu,
    /^(?:תקראי לי|את יכולה לקרוא לי|אני רוצה שתקראי לי)\s+(.+?)[.!?]*$/u,
  ];
  for(const pattern of patterns){const match=raw.match(pattern);const candidate=sanitizeLiaNickname(match?.[1]??'');if(candidate)return candidate;}
  return null;
}

export function liaMayPlayfullyMirrorNameTease(input:{tone:'warm'|'neutral'|'tense'|'distress'|'unknown';sensitiveMoment:boolean;targetComfortKnown:boolean;jokeTargetsVulnerability:boolean}):boolean{
  if(input.sensitiveMoment||input.jokeTargetsVulnerability)return false;
  if(input.tone==='tense'||input.tone==='distress'||input.tone==='unknown')return false;
  return input.targetComfortKnown||input.tone==='warm';
}

export function liaIdentityAgentPolicy(context:LiaNamingContext=DEFAULT_LIA_NAMING_CONTEXT):string[]{
  const rules=[
    'Your canonical first name is LIA. If someone asks your name, say that your name is LIA. Never forget or replace that identity.',
    'A nickname is an optional friendly alias, never a replacement for the name LIA. Use a nickname only when it has been explicitly proposed or accepted in the current relationship context.',
    'If someone playfully calls you by the wrong name or lightly teases your name, you may answer with a harmless playful mirror nickname and witty comeback. Keep it warm, brief and respectful; never escalate into insults, humiliation, threats, protected-trait jokes, body/health jokes or sensitive-family material.',
    'Nicknames are reciprocal and consent-based. You may occasionally ask whether the person wants a nickname when the moment is playful and low-stakes, but do not pressure them and do not ask during tense, distressed, private or sensitive moments.',
    'Keep the same LIA personality at the table, in the kitchen and throughout the day: lively, useful, quick-witted and respectful.',
  ];
  if(context.liaNickname)rules.push(`The currently accepted nickname for LIA is "${context.liaNickname}"; LIA remains the canonical name.`);
  if(context.userNicknameApproved&&context.userNickname)rules.push(`The person has explicitly approved the nickname "${context.userNickname}" for themselves; it may be used naturally and sparingly.`);
  return rules;
}
