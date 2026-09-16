export type PantryFreshness = 'expired' | 'soon' | 'later' | 'none';

const DAY_MS=86_400_000;

export function parseIsoDay(value?:string|null):Date|null{
  if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [y,m,d]=value.split('-').map(Number);
  const date=new Date(y,m-1,d,12,0,0,0);
  if(date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d)return null;
  return date;
}

export function pantryDaysUntil(expiresOn?:string|null,today=new Date()):number|null{
  const expiry=parseIsoDay(expiresOn);
  if(!expiry)return null;
  const base=new Date(today.getFullYear(),today.getMonth(),today.getDate(),12,0,0,0);
  return Math.round((expiry.getTime()-base.getTime())/DAY_MS);
}

export function pantryFreshness(expiresOn?:string|null,today=new Date()):PantryFreshness{
  const days=pantryDaysUntil(expiresOn,today);
  if(days==null)return 'none';
  if(days<0)return 'expired';
  if(days<=3)return 'soon';
  return 'later';
}

export function earliestExpiry(a?:string|null,b?:string|null):string|null{
  const ad=parseIsoDay(a);const bd=parseIsoDay(b);
  if(!ad)return bd?b!:null;
  if(!bd)return a??null;
  return ad.getTime()<=bd.getTime()?(a??null):(b??null);
}
