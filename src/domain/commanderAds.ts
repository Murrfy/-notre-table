import {COMMANDER_MAX_RADIUS_KM,type CommanderPlace} from './commander';

export type CommanderSponsoredCampaign={
  id:string;
  advertiser:string;
  place:CommanderPlace&{sponsored:true};
  category?:string|null;
  radiusKm:number;
  startsAt?:string|null;
  endsAt?:string|null;
  scheduleEligible:boolean;
  budgetEligible:boolean;
  impressionCapReached:boolean;
  frequencyCapPerDay:number;
};

export type CommanderSponsoredExposure={campaignId:string;shownAt:string};
export type CommanderSponsoredContext={
  category?:string|null;
  nowIso:string;
  exposures:ReadonlyArray<CommanderSponsoredExposure>;
};

function sameUtcDay(a:string,b:string){return a.slice(0,10)===b.slice(0,10);}
function activeAt(campaign:CommanderSponsoredCampaign,now:number){
  const start=campaign.startsAt?Date.parse(campaign.startsAt):Number.NEGATIVE_INFINITY;
  const end=campaign.endsAt?Date.parse(campaign.endsAt):Number.POSITIVE_INFINITY;
  return Number.isFinite(start)||start===Number.NEGATIVE_INFINITY
    ? (Number.isFinite(end)||end===Number.POSITIVE_INFINITY)&&now>=start&&now<=end
    : false;
}

/**
 * Client-side safety filter only. Budget and complex local-hour scheduling are
 * trusted-server/provider decisions. This function never receives confidences,
 * health, relationship or other sensitive profile data.
 */
export function eligibleCommanderSponsoredCampaigns(campaigns:ReadonlyArray<CommanderSponsoredCampaign>,context:CommanderSponsoredContext){
  const now=Date.parse(context.nowIso);if(!Number.isFinite(now))return [];
  const requested=(context.category??'').trim().toLowerCase();
  return campaigns.filter(campaign=>{
    if(campaign.place.sponsored!==true)return false;
    if(!campaign.scheduleEligible||!campaign.budgetEligible||campaign.impressionCapReached)return false;
    if(!Number.isFinite(campaign.radiusKm)||campaign.radiusKm<=0||campaign.radiusKm>COMMANDER_MAX_RADIUS_KM)return false;
    if(typeof campaign.place.distanceKm!=='number'||campaign.place.distanceKm>campaign.radiusKm)return false;
    if(!activeAt(campaign,now))return false;
    if(requested&&campaign.category&&campaign.category.trim().toLowerCase()!==requested)return false;
    const daily=context.exposures.filter(exposure=>exposure.campaignId===campaign.id&&sameUtcDay(exposure.shownAt,context.nowIso)).length;
    if(campaign.frequencyCapPerDay>0&&daily>=campaign.frequencyCapPerDay)return false;
    return true;
  });
}

export function interleaveCommanderSponsored<T extends {sponsored?:boolean}>(natural:ReadonlyArray<T>,sponsored:ReadonlyArray<T>,limit=8){
  const result:T[]=[];let adIndex=0;let naturalSinceAd=0;
  for(const row of natural){
    if(row.sponsored)continue;
    result.push(row);naturalSinceAd++;
    if(result.length>=limit)break;
    if(naturalSinceAd>=2&&adIndex<sponsored.length){
      const ad=sponsored[adIndex++];
      if(ad?.sponsored===true){result.push(ad);naturalSinceAd=0;}
      if(result.length>=limit)break;
    }
  }
  return result.slice(0,limit);
}
