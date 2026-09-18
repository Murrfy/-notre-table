export type LiaTableDataKind='raw_turn'|'speaker_track'|'confirmed_fact'|'accepted_memo';

export function liaTableDataMayPersist(kind:LiaTableDataKind):boolean{
  return kind==='confirmed_fact'||kind==='accepted_memo';
}

export function liaTableRawSpeechRetention(){
  return{scope:'memory_only' as const,until:'session_stop' as const};
}
