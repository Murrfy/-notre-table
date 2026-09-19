import type {LiaRelationshipFact} from './liaRelationshipMemory';

export type LiaNameVoicePreference={
  subjectLabel:string;
  displayName:string;
  spokenName:string;
};

function clean(value:string,max=80){return value.trim().replace(/\s+/g,' ').slice(0,max);}

export function firstNameFromDisplayName(displayName:string):string{
  return clean(displayName).split(/\s+/)[0]??'';
}

export function resolvePreferredSpokenName(input:{
  displayName:string;
  subjectLabel?:string|null;
  relationshipFacts?:ReadonlyArray<LiaRelationshipFact>;
}):LiaNameVoicePreference|null{
  const displayName=clean(input.displayName);
  const subjectLabel=clean(input.subjectLabel??displayName);
  if(!displayName||!subjectLabel)return null;
  const fact=[...(input.relationshipFacts??[])].find(row=>
    row.confirmed&&row.subjectLabel===subjectLabel&&row.factKey==='name_pronunciation'&&row.factValue.trim()
  );
  return{subjectLabel,displayName,spokenName:clean(fact?.factValue??firstNameFromDisplayName(displayName))};
}

export function namePronunciationCorrectionFact(input:{
  subjectLabel:string;
  spokenName:string;
}):{topic:'family';subjectLabel:string;factKey:'name_pronunciation';factValue:string;sensitivity:'ordinary';householdSafe:false;confirmed:true}{
  const subjectLabel=clean(input.subjectLabel);
  const spokenName=clean(input.spokenName);
  if(!subjectLabel||!spokenName)throw new Error('NAME_PRONUNCIATION_REQUIRED');
  return{topic:'family',subjectLabel,factKey:'name_pronunciation',factValue:spokenName,sensitivity:'ordinary',householdSafe:false,confirmed:true};
}

export function shouldUseNameAtConversationStart(input:{
  isConversationStart:boolean;
  turnsSinceStart:number;
  usedNameThisConversation:boolean;
}):boolean{
  return input.isConversationStart&&input.turnsSinceStart===0&&!input.usedNameThisConversation;
}

export function openingAddress(spokenName:string,shouldUse:boolean):string|null{
  const safe=clean(spokenName);
  return shouldUse&&safe?safe:null;
}


export function shouldAskNamePronunciation(input:{
  displayName:string;
  hasConfirmedPronunciation:boolean;
  pronunciationConfidence:'high'|'uncertain';
  alreadyAsked:boolean;
}):boolean{
  const firstName=firstNameFromDisplayName(input.displayName);
  if(!firstName||input.hasConfirmedPronunciation||input.alreadyAsked)return false;
  return input.pronunciationConfidence==='uncertain';
}

export function pronunciationQuestion(languageTag:string):string{
  const tag=languageTag.toLowerCase();
  if(tag.startsWith('fr'))return 'Je veux être sûre de bien dire ton prénom, tu me le prononces ?';
  if(tag.startsWith('es'))return 'Quiero asegurarme de pronunciar bien tu nombre, ¿me dices cómo se pronuncia?';
  if(tag.startsWith('he'))return 'אני רוצה לוודא שאני מבטאת נכון את השם שלך. איך מבטאים אותו?';
  return 'I want to make sure I pronounce your name correctly. How do you pronounce it?';
}


export function applyPreferredSpokenNameToSpeech(input:{
  text:string;
  displayName:string;
  spokenName:string;
}):string{
  const text=input.text;
  const displayFirst=firstNameFromDisplayName(input.displayName);
  const spoken=clean(input.spokenName);
  if(!text||!displayFirst||!spoken||displayFirst===spoken)return text;
  const escaped=displayFirst.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  return text.replace(new RegExp(`\\b${escaped}\\b`,'gu'),spoken);
}


export type LiaFamilyNameCandidate={
  memberId:string;
  displayName:string;
  relationLabel?:string|null;
};

export function resolveFamilySpokenNames(input:{
  members:ReadonlyArray<LiaFamilyNameCandidate>;
  relationshipFacts?:ReadonlyArray<LiaRelationshipFact>;
}):Array<LiaNameVoicePreference&{memberId:string;relationLabel:string|null}>{
  return input.members.map(member=>{
    const resolved=resolvePreferredSpokenName({
      displayName:member.displayName,
      subjectLabel:member.memberId,
      relationshipFacts:input.relationshipFacts,
    });
    return resolved?{...resolved,memberId:member.memberId,relationLabel:member.relationLabel??null}:null;
  }).filter((value):value is LiaNameVoicePreference&{memberId:string;relationLabel:string|null}=>value!==null);
}

export function familyNamePronunciationCorrectionFact(input:{
  memberId:string;
  spokenName:string;
}){
  return namePronunciationCorrectionFact({subjectLabel:clean(input.memberId),spokenName:input.spokenName});
}

export function familyPronunciationQuestion(input:{
  displayName:string;
  relationLabel?:string|null;
  languageTag:string;
}):string{
  const name=firstNameFromDisplayName(input.displayName);
  const relation=clean(input.relationLabel??'');
  if(input.languageTag.toLowerCase().startsWith('fr')){
    return relation
      ?`Je veux être sûre de bien prononcer le prénom de ${relation}, ${name}. Tu me le prononces ?`
      :`Je veux être sûre de bien prononcer ${name}. Tu me le prononces ?`;
  }
  return `I want to make sure I pronounce ${name} correctly. How do you pronounce it?`;
}
