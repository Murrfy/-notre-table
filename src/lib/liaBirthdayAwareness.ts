export type LiaBirthdayDistance={days:number;year:number};

function leap(year:number):boolean{return year%4===0&&(year%100!==0||year%400===0);}
function normalizedDay(year:number,month:number,day:number):number{
  if(month===2&&day===29&&!leap(year))return 28;
  return day;
}
function utcDayNumber(year:number,month:number,day:number):number{
  return Math.floor(Date.UTC(year,month-1,day)/86_400_000);
}

export function liaDaysUntilBirthday(month:number,day:number,now=new Date()):LiaBirthdayDistance|null{
  if(!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1||day>31)return null;
  const today=utcDayNumber(now.getFullYear(),now.getMonth()+1,now.getDate());
  for(let year=now.getFullYear();year<=now.getFullYear()+1;year++){
    const d=normalizedDay(year,month,day);
    const candidate=new Date(Date.UTC(year,month-1,d));
    if(candidate.getUTCMonth()!==month-1||candidate.getUTCDate()!==d)continue;
    const diff=utcDayNumber(year,month,d)-today;
    if(diff>=0)return{days:diff,year};
  }
  return null;
}
