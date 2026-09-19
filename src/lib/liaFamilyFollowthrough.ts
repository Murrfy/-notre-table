export type LiaFamilyReplyReadinessItem={responded:boolean;takesCharge:boolean};

export function liaFamilyRepliesReady(input:{
  recipients:LiaFamilyReplyReadinessItem[];
  takeChargeName:string|null;
}):boolean{
  if(!input.recipients.length)return false;
  if(input.takeChargeName?.trim())return false;
  if(input.recipients.some(item=>item.takesCharge))return false;
  return input.recipients.every(item=>item.responded);
}
