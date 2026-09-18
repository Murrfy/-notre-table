export type LiaTableResearchResultState=
  'working'|'ready_to_share'|'shared'|'memo_offered'|'memo_saved'|'closed';

export function nextLiaTableResearchResultState(input:{
  state:LiaTableResearchResultState;
  resultReady?:boolean;
  sharedWithOrganizer?:boolean;
  memoOffered?:boolean;
  memoAccepted?:boolean;
  close?:boolean;
}):LiaTableResearchResultState{
  if(input.close)return'closed';
  if(input.memoAccepted&&input.state==='memo_offered')return'memo_saved';
  if(input.memoOffered&&input.state==='shared')return'memo_offered';
  if(input.sharedWithOrganizer&&input.state==='ready_to_share')return'shared';
  if(input.resultReady&&input.state==='working')return'ready_to_share';
  return input.state;
}
