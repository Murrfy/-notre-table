import type {LiaNavigationDestinationCandidate} from './liaNavigationDestination';

export type LiaNavigationLiveControlCommand=
  |{kind:'stop'}
  |{kind:'add_stop';candidate:LiaNavigationDestinationCandidate};

type Listener=(command:LiaNavigationLiveControlCommand)=>void;
const listeners=new Set<Listener>();

export function subscribeLiaNavigationLiveControl(listener:Listener){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function requestLiaNavigationStop(){for(const listener of [...listeners])listener({kind:'stop'});}
export function requestLiaNavigationStopover(candidate:LiaNavigationDestinationCandidate){for(const listener of [...listeners])listener({kind:'add_stop',candidate});}
