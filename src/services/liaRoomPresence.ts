export type LiaRoomPerson={memberId:string;displayName:string};
export type LiaRoomPresenceState={
  present:LiaRoomPerson[];
  unidentifiedTrackIds:string[];
  lastIdentityPromptAt:number|null;
};

export function createLiaRoomPresenceState():LiaRoomPresenceState{
  return{present:[],unidentifiedTrackIds:[],lastIdentityPromptAt:null};
}

export function noteLiaRoomSpeaker(input:{
  state:LiaRoomPresenceState;
  trackId:string;
  member:LiaRoomPerson|null;
  identityConfidence:number;
  overlappingSpeech?:boolean;
}):LiaRoomPresenceState{
  const reliable=Boolean(input.member)&&input.identityConfidence>=.9&&!input.overlappingSpeech;
  if(reliable){
    const member=input.member!;
    return{
      ...input.state,
      present:[...input.state.present.filter(row=>row.memberId!==member.memberId),member],
      unidentifiedTrackIds:input.state.unidentifiedTrackIds.filter(id=>id!==input.trackId),
    };
  }
  if(input.state.unidentifiedTrackIds.includes(input.trackId))return input.state;
  return{...input.state,unidentifiedTrackIds:[...input.state.unidentifiedTrackIds,input.trackId]};
}

export function liaShouldAskWhoJoined(input:{
  state:LiaRoomPresenceState;
  conversationBusy:boolean;
  now?:number;
  minimumGapMs?:number;
}):boolean{
  const now=input.now??Date.now();
  if(input.conversationBusy||input.state.unidentifiedTrackIds.length===0)return false;
  const gap=Math.max(30_000,input.minimumGapMs??90_000);
  return !input.state.lastIdentityPromptAt||now-input.state.lastIdentityPromptAt>=gap;
}

export function noteLiaIdentityPrompt(state:LiaRoomPresenceState,now=Date.now()):LiaRoomPresenceState{
  return{...state,lastIdentityPromptAt:now};
}

export function liaWhoJoinedQuestion(languageTag:string):string{
  if(languageTag.toLowerCase().startsWith('fr'))return "Tiens, qui s'est joint à nous ?";
  if(languageTag.toLowerCase().startsWith('he'))return 'מי הצטרף אלינו?';
  return 'Who just joined us?';
}

export function liaGreetingForIdentifiedPerson(displayName:string,languageTag:string):string{
  const name=displayName.trim();
  if(languageTag.toLowerCase().startsWith('fr'))return `Ah, salut ${name} !`;
  if(languageTag.toLowerCase().startsWith('he'))return `אה, שלום ${name}!`;
  return `Oh, hi ${name}!`;
}

export function liaMayParticipateSocially(input:{
  knownSpeakerCount:number;
  unidentifiedSpeakerCount:number;
  overlappingSpeech:boolean;
  cookingContext:boolean;
  directlyAddressed:boolean;
}):boolean{
  if(input.directlyAddressed)return true;
  if(input.cookingContext)return true;
  if(input.overlappingSpeech||input.unidentifiedSpeakerCount>0)return false;
  return input.knownSpeakerCount>0;
}
