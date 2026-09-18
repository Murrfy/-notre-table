export type LiaReminderSeed={body:string|null;day:Date|null;displayDay:string|null};
export type LiaParsedReminder={body:string|null;day:Date|null;displayDay:string|null;target:Date|null;displayWhen:string|null};

function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").trim();}
function atLocalTime(day:Date,hour:number,minute:number):Date{const value=new Date(day);value.setHours(hour,minute,0,0);return value;}
function startOfDay(value:Date):Date{const day=new Date(value);day.setHours(0,0,0,0);return day;}
function sameDay(a:Date,b:Date):boolean{return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function nextWeekday(now:Date,weekday:number):Date{const day=startOfDay(now);const current=day.getDay();const delta=(weekday-current+7)%7;day.setDate(day.getDate()+delta);return day;}
function frenchTime(hour:number,minute:number):string{return minute?`${hour} h ${String(minute).padStart(2,'0')}`:`${hour} h`;}
function displayForTarget(target:Date,now:Date,preferredDay:string|null):string{
  const time=frenchTime(target.getHours(),target.getMinutes());
  if(preferredDay)return`${preferredDay} à ${time}`;
  if(sameDay(target,now))return`aujourd’hui à ${time}`;
  const tomorrow=new Date(startOfDay(now));tomorrow.setDate(tomorrow.getDate()+1);
  if(sameDay(target,tomorrow))return`demain à ${time}`;
  return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(target).replace(':',' h ');
}
function cleanBody(value:string):string{
  return value.replace(/^[\s,;:.-]+/,'').replace(/^(?:de\s+|d['’]\s*|que\s+|pour\s+)/i,'').replace(/^[\s,;:.-]+/,'').replace(/[\s,;:.-]+$/,'').trim();
}
function weekdayFromText(value:string):{weekday:number;label:string;match:string}|null{
  const days:Array<[RegExp,number,string]>=[
    [/\blundi\b/i,1,'lundi'],[/\bmardi\b/i,2,'mardi'],[/\bmercredi\b/i,3,'mercredi'],[/\bjeudi\b/i,4,'jeudi'],[/\bvendredi\b/i,5,'vendredi'],[/\bsamedi\b/i,6,'samedi'],[/\bdimanche\b/i,0,'dimanche'],
  ];
  for(const [pattern,weekday,label] of days){const match=value.match(pattern);if(match)return{weekday,label,match:match[0]};}
  return null;
}

export function parseLiaReminderRequest(text:string,now:Date,seed:LiaReminderSeed|null=null):LiaParsedReminder{
  let working=text.trim().replace(/^(?:lia[\s,:-]*)?/i,'').replace(/^(?:rappelle[- ]moi|rappelle[- ]nous|remind me)\s*/i,'').trim();
  let body=seed?.body??null;
  let day=seed?.day?new Date(seed.day):null;
  let displayDay=seed?.displayDay??null;
  let target:Date|null=null;
  let displayWhen:string|null=null;

  const duration=working.match(/\bdans\s+(\d{1,4})\s*(minutes?|mins?|min|heures?|hrs?|h)\b/i);
  if(duration){
    const amount=Number(duration[1]);const unit=fold(duration[2]);
    if(amount>0){target=new Date(now.getTime()+amount*(unit.startsWith('h')||unit.startsWith('heure')?3600000:60000));displayWhen=`dans ${amount} ${unit.startsWith('h')||unit.startsWith('heure')?(amount===1?'heure':'heures'):(amount===1?'minute':'minutes')}`;}
    working=working.replace(duration[0],' ').trim();
  }

  if(!target){
    const tomorrow=working.match(/\bdemain\b/i);
    const today=working.match(/\baujourd(?:['’])?hui\b/i);
    const tonight=working.match(/\bce soir\b/i);
    const weekday=weekdayFromText(working);
    if(tomorrow){day=startOfDay(now);day.setDate(day.getDate()+1);displayDay='demain';working=working.replace(tomorrow[0],' ').trim();}
    else if(today||tonight){day=startOfDay(now);displayDay=tonight?'ce soir':'aujourd’hui';working=working.replace((today??tonight)![0],' ').trim();}
    else if(weekday){day=nextWeekday(now,weekday.weekday);displayDay=weekday.label;working=working.replace(weekday.match,' ').trim();}

    const time=working.match(/(?:^|\s)(?:à|a)\s*(\d{1,2})(?:\s*(?:h(?:eures?)?|:)\s*(\d{1,2})?)?(?=\s|$|[,.!?;])/i)||working.match(/(?:^|\s)(\d{1,2})\s*h\s*(\d{0,2})(?=\s|$|[,.!?;])/i);
    if(time){
      const hour=Number(time[1]),minute=Number(time[2]||0);
      if(hour>=0&&hour<=23&&minute>=0&&minute<=59){
        const base=day??startOfDay(now);target=atLocalTime(base,hour,minute);
        if(!day&&target.getTime()<=now.getTime()){target.setDate(target.getDate()+1);displayDay='demain';}
        else if(day&&target.getTime()<=now.getTime()&&displayDay&&!["aujourd’hui","ce soir"].includes(displayDay)){target.setDate(target.getDate()+7);}
        displayWhen=displayForTarget(target,now,displayDay);
      }
      working=working.replace(time[0],' ').trim();
    }
  }

  const candidate=cleanBody(working);
  if(candidate)body=candidate;
  return{body,day,displayDay,target,displayWhen};
}
