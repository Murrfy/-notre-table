import type {CommanderSponsoredExposure} from '../domain/commanderAds';

let exposures:CommanderSponsoredExposure[]=[];

/** Record only after a sponsored card has actually become visible. */
export function recordCommanderSponsoredImpression(campaignId:string,shownAt=new Date().toISOString()){
  if(!campaignId.trim())return;
  exposures=[...exposures,{campaignId:campaignId.trim(),shownAt}];
}

export function commanderSponsoredExposures(){return [...exposures];}
export function resetCommanderSponsoredSession(){exposures=[];}
