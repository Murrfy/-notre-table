import type {LiaNavigationCoordinate} from '../../modules/lia-navigation';

export type LiaNavigationRouteSummary={
  destinationLabel:string;
  etaMinutes:number|null;
  distanceKm:number|null;
};

export type LiaNavigationEngineStartResult=
  |{status:'started';summary:LiaNavigationRouteSummary}
  |{status:'needs_destination_resolution'}
  |{status:'engine_unavailable'}
  |{status:'failed'};

export interface LiaNavigationEngineAdapter{
  isAvailable():boolean;
  start(input:{origin:LiaNavigationCoordinate;destination:string}):Promise<LiaNavigationEngineStartResult>;
  stop?():Promise<void>|void;
}

let adapter:LiaNavigationEngineAdapter|null=null;

export function registerLiaNavigationEngineAdapter(value:LiaNavigationEngineAdapter|null){adapter=value;}
export function liaNavigationEngineAvailable():boolean{return Boolean(adapter?.isAvailable());}
export async function startLiaNavigationEngine(input:{origin:LiaNavigationCoordinate;destination:string}):Promise<LiaNavigationEngineStartResult>{
  if(!adapter?.isAvailable())return{status:'engine_unavailable'};
  try{return await adapter.start(input);}catch{return{status:'failed'};}
}
export async function stopLiaNavigationEngine(){try{await adapter?.stop?.();}catch{}}
