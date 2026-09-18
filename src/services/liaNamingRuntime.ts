import {extractApprovedUserNickname,extractProposedLiaNickname,liaAskedHerName,liaDirectAddressNames,stripLiaKnownDirectName,type LiaNamingContext} from '../lib/liaIdentity';
import {saveLiaNamingPreferences} from './liaNamingPreferences';

export type LiaNamingTurnResult={handled:boolean;reply:string|null;preferences:LiaNamingContext};

function language(languageTag:string):'fr'|'en'|'es'|'he'{
  const tag=languageTag.toLowerCase();
  if(tag.startsWith('fr'))return'fr';if(tag.startsWith('es'))return'es';if(tag.startsWith('he'))return'he';return'en';
}

function nameReply(tag:string):string{
  const l=language(tag);return l==='fr'?"Je m’appelle LIA.":l==='es'?'Me llamo LIA.':l==='he'?'קוראים לי LIA.':'My name is LIA.';
}
function liaNicknameReply(tag:string,nickname:string):string{
  const l=language(tag);return l==='fr'?`Ça me va 😏. Tu peux m’appeler ${nickname}, mais mon prénom reste LIA.`:l==='es'?`Me gusta 😏. Puedes llamarme ${nickname}, pero mi nombre sigue siendo LIA.`:l==='he'?`מתאים לי 😏. אפשר לקרוא לי ${nickname}, אבל השם שלי נשאר LIA.`:`Works for me 😏. You can call me ${nickname}, but my name is still LIA.`;
}
function userNicknameReply(tag:string,nickname:string):string{
  const l=language(tag);return l==='fr'?`Marché conclu, ${nickname} 😏.`:l==='es'?`Hecho, ${nickname} 😏.`:l==='he'?`סגרנו, ${nickname} 😏.`:`Deal, ${nickname} 😏.`;
}

export async function handleLiaNamingTurn(input:{text:string;languageTag:string;preferences:LiaNamingContext}):Promise<LiaNamingTurnResult>{
  const directNames=liaDirectAddressNames(input.preferences.liaNickname);
  if(!stripLiaKnownDirectName(input.text,directNames).directAddressed)return{handled:false,reply:null,preferences:input.preferences};
  if(liaAskedHerName(input.text,directNames))return{handled:true,reply:nameReply(input.languageTag),preferences:input.preferences};
  const liaNickname=extractProposedLiaNickname(input.text,directNames);
  if(liaNickname){
    const preferences=await saveLiaNamingPreferences({...input.preferences,liaNickname});
    return{handled:true,reply:liaNicknameReply(input.languageTag,liaNickname),preferences};
  }
  const userNickname=extractApprovedUserNickname(input.text,directNames);
  if(userNickname){
    const preferences=await saveLiaNamingPreferences({...input.preferences,userNickname,userNicknameApproved:true});
    return{handled:true,reply:userNicknameReply(input.languageTag,userNickname),preferences};
  }
  return{handled:false,reply:null,preferences:input.preferences};
}
