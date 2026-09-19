import {liaSpeakerIdentityPolicy,liaUnknownSpeakerQuestion} from './liaSpeakerIdentityPolicy';
import {beginLiaSpeakerIdentification,consumeLiaSpeakerIdentification,liaIdentityAnswerName,liaSpeakerGreeting,mayAskLiaSpeakerIdentityAgain,noteLiaSpeakerIdentityAsked} from './liaSpeakerIdentitySession';
import {LiaSpeakerRosterPerson,liaSpeakerDisambiguationQuestion,resolveLiaSpeakerFromRoster} from './liaSpeakerRosterResolution';

export type LiaSpeakerIdentificationAction=
 |{kind:'none'}
 |{kind:'ask_identity';trackId:string;spokenReply:string;answerFirst:boolean}
 |{kind:'confirmed';trackId:string;memberId:string;spokenReply:string}
 |{kind:'clarify';trackId:string;spokenReply:string}
 |{kind:'unknown_name';trackId:string;spokenReply:string};

export function maybeAskLiaSpeakerIdentity(input:{trackId:string;memberId:string|null;identityConfidence:number;overlappingSpeech?:boolean;context:'table'|'cooking';urgentPracticalQuestion?:boolean;languageTag:string}):LiaSpeakerIdentificationAction{
 const policy=liaSpeakerIdentityPolicy(input);
 if(!policy.shouldAskIdentity||!mayAskLiaSpeakerIdentityAgain(input.trackId))return{kind:'none'};
 noteLiaSpeakerIdentityAsked(input.trackId);
 beginLiaSpeakerIdentification(input.trackId);
 return{kind:'ask_identity',trackId:input.trackId,spokenReply:liaUnknownSpeakerQuestion(input.languageTag),answerFirst:policy.answerBeforeIdentityQuestion};
}

export function resolvePendingLiaSpeakerIdentity(input:{text:string;roster:LiaSpeakerRosterPerson[];languageTag:string}):LiaSpeakerIdentificationAction{
 const pending=consumeLiaSpeakerIdentification();
 if(!pending)return{kind:'none'};
 const name=liaIdentityAnswerName(input.text);
 if(!name){beginLiaSpeakerIdentification(pending.trackId);return{kind:'clarify',trackId:pending.trackId,spokenReply:liaUnknownSpeakerQuestion(input.languageTag)};}
 const resolution=resolveLiaSpeakerFromRoster(name,input.roster);
 if(resolution.status==='matched')return{kind:'confirmed',trackId:pending.trackId,memberId:resolution.person.subjectId,spokenReply:liaSpeakerGreeting(resolution.person.displayName,input.languageTag)};
 if(resolution.status==='ambiguous'){beginLiaSpeakerIdentification(pending.trackId);return{kind:'clarify',trackId:pending.trackId,spokenReply:liaSpeakerDisambiguationQuestion(resolution.candidates,input.languageTag)};}
 const fr=input.languageTag.toLowerCase().startsWith('fr');
 return{kind:'unknown_name',trackId:pending.trackId,spokenReply:fr?'Enchantée '+name+'. Je ne te trouve pas encore dans la famille, donc je ne vais rien t’attribuer au hasard.':'Nice to meet you '+name+'. I cannot match you to the family yet, so I will not assign anything to you by guesswork.'};
}