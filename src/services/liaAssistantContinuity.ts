export type LiaExternalHandoffKind='phone'|'music'|'message'|'other';
let handoffUntilMs=0;
let handoffKind:LiaExternalHandoffKind|null=null;

export function markLiaExternalHandoff(kind:LiaExternalHandoffKind,atMs=Date.now(),graceMs=15_000):void{
  handoffKind=kind;
  handoffUntilMs=atMs+Math.max(1000,graceMs);
}

export function liaExternalHandoffActive(atMs=Date.now()):boolean{return handoffKind!==null&&atMs<=handoffUntilMs;}
export function currentLiaExternalHandoff(atMs=Date.now()):LiaExternalHandoffKind|null{return liaExternalHandoffActive(atMs)?handoffKind:null;}
export function clearLiaExternalHandoff():void{handoffKind=null;handoffUntilMs=0;}
