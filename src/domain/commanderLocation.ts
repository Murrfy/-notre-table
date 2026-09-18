import type {PrivacyConsentState} from './privacyConsent';
import {mayUsePreciseLocation} from './privacyConsent';

export type CommanderDestinationSource='manual'|'household'|'current'|'missing';
export type CommanderDestination={source:CommanderDestinationSource;address:string|null};

export function resolveCommanderDestination(input:{
  manualAddress?:string|null;
  householdAddress?:string|null;
  currentAddress?:string|null;
  useCurrentLocation?:boolean;
  consent:PrivacyConsentState;
}):CommanderDestination{
  const manual=input.manualAddress?.trim();
  if(manual)return{source:'manual',address:manual};
  const home=input.householdAddress?.trim();
  if(!input.useCurrentLocation&&home)return{source:'household',address:home};
  const current=input.currentAddress?.trim();
  if(input.useCurrentLocation&&current&&mayUsePreciseLocation(input.consent))return{source:'current',address:current};
  if(home)return{source:'household',address:home};
  return{source:'missing',address:null};
}

export function canOfferCurrentLocation(input:{currentAddress?:string|null;consent:PrivacyConsentState}){
  return !!input.currentAddress?.trim()&&mayUsePreciseLocation(input.consent);
}

function normalizedAddress(value:string|null|undefined){return(value??'').trim().toLocaleLowerCase();}

export function commanderNeedsDestinationChoice(input:{householdAddress?:string|null;currentAddress?:string|null;consent:PrivacyConsentState}){
  const home=normalizedAddress(input.householdAddress);const current=normalizedAddress(input.currentAddress);
  return !!home&&!!current&&home!==current&&mayUsePreciseLocation(input.consent);
}
