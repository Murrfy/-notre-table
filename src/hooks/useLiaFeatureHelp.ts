import {useEffect,useRef} from 'react';
import {emitLiaAppFeatureHelp,type LiaAppFeature,type LiaAppFeatureHelpStep} from '../services/liaContextualGuidance';

export function useLiaFeatureHelp(input:{
  active:boolean;
  householdId:string;
  organizerName:string;
  feature:LiaAppFeature;
  step:LiaAppFeatureHelpStep|null;
  progressKey:string;
  delayMs?:number;
}):void{
  const emittedRef=useRef(new Set<string>());
  useEffect(()=>{
    if(!input.active||!input.step||!input.householdId)return;
    const key=`${input.feature}:${input.step}:${input.progressKey}`;
    if(emittedRef.current.has(key))return;
    const timer=setTimeout(()=>{
      emittedRef.current.add(key);
      emitLiaAppFeatureHelp({
        householdId:input.householdId,
        organizerName:input.organizerName,
        feature:input.feature,
        step:input.step!,
      });
    },Math.max(12_000,input.delayMs??35_000));
    return()=>clearTimeout(timer);
  },[input.active,input.householdId,input.organizerName,input.feature,input.step,input.progressKey,input.delayMs]);
}
