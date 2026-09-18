export type LiaTimerIntent='start'|'remaining'|'cancel';
export type LiaTimerCommand={kind:LiaTimerIntent;durationSeconds:number|null;label:string|null};

function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/[.,!?;:]+/g,' ').replace(/\s+/g,' ').trim();}

const FR_UNITS:Record<string,number>={
  zero:0,un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,
  vingt:20,trente:30,quarante:40,cinquante:50,soixante:60,
};
const EN_UNITS:Record<string,number>={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60};
const ES_UNITS:Record<string,number>={cero:0,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,veinte:20,treinta:30,cuarenta:40,cincuenta:50,sesenta:60};

function parseWordNumber(raw:string):number|null{
  const value=fold(raw).replace(/-/g,' ');
  if(/^\d{1,4}$/.test(value))return Number(value);
  const words=value.split(/\s+/).filter(word=>!['et','and','y'].includes(word));
  if(!words.length||words.length>3)return null;
  const dictionaries=[FR_UNITS,EN_UNITS,ES_UNITS];
  for(const dict of dictionaries){
    if(words.every(word=>dict[word]!==undefined)){
      const nums=words.map(word=>dict[word]);
      if(nums.length===1)return nums[0];
      if(nums.length===2&&nums[0]>=20&&nums[1]<10)return nums[0]+nums[1];
      if(nums.length===3&&nums[0]>=20&&nums[1]<10&&nums[2]===undefined)return nums[0]+nums[1];
    }
  }
  return null;
}

function parseDurationSeconds(text:string):number|null{
  const value=fold(text);
  const token='(\\d{1,4}|[a-zàâäéèêëîïôöùûüç-]+(?:\\s+(?:et|and|y)\\s+)?[a-zàâäéèêëîïôöùûüç-]*)';
  const hourPattern=new RegExp(`\\b${token}\\s*(?:heures?|hrs?|hours?|h)\\b`,'i');
  const minutePattern=new RegExp(`\\b${token}\\s*(?:minutes?|mins?|minutos?|min)\\b`,'i');
  const secondPattern=new RegExp(`\\b${token}\\s*(?:secondes?|secs?|seconds?|segundos?|sec|s)\\b`,'i');
  let total=0,found=false;
  const hour=value.match(hourPattern);if(hour){const n=parseWordNumber(hour[1]);if(n!==null){total+=n*3600;found=true;}}
  const minute=value.match(minutePattern);if(minute){const n=parseWordNumber(minute[1]);if(n!==null){total+=n*60;found=true;}}
  const second=value.match(secondPattern);if(second){const n=parseWordNumber(second[1]);if(n!==null){total+=n;found=true;}}
  return found&&total>0&&total<=24*3600?total:null;
}

function extractLabel(text:string):string|null{
  const value=text.trim();
  const quoted=value.match(/["“«](.+?)["”»]/);if(quoted?.[1]?.trim())return quoted[1].trim().slice(0,60);
  const named=value.match(/(?:appele|appelé|nomme|nommé|called|named|llamado|llamada)\s+([\p{L}\d][\p{L}\d '\-]{0,59})/iu);
  if(named?.[1]?.trim())return named[1].trim().replace(/[.!?]+$/,'').slice(0,60);
  return null;
}

export function parseLiaTimerCommand(text:string):LiaTimerCommand|null{
  const value=fold(text).replace(/^lia\s*/,'').trim();
  const mentionsTimer=/\b(minuteur|chrono|timer|temporizador|טיימר)\b/i.test(value);
  const asksRemaining=/(?:combien\s+(?:de\s+temps\s+)?(?:il\s+)?reste|il\s+reste\s+combien|temps\s+restant|how\s+(?:much|long).*left|time\s+left|cuanto\s+(?:tiempo\s+)?queda|כמה\s+זמן\s+נשאר)/i.test(value);
  const asksCancel=/(?:arrete|stoppe|annule|supprime|cancel|stop|delete|para|cancela|בטל|עצור)/i.test(value)&&mentionsTimer;
  if(asksRemaining&&(mentionsTimer||/\bil\s+reste\s+combien\b/.test(value)))return{kind:'remaining',durationSeconds:null,label:extractLabel(text)};
  if(asksCancel)return{kind:'cancel',durationSeconds:null,label:extractLabel(text)};
  const asksStart=mentionsTimer&&/(?:mets|met|lance|demarre|demarre|start|set|pon|inicia|הפעל|שים)/i.test(value);
  if(!asksStart)return null;
  return{kind:'start',durationSeconds:parseDurationSeconds(value),label:extractLabel(text)};
}

export function formatLiaTimerRemaining(seconds:number,languageTag:string):string{
  const safe=Math.max(0,Math.ceil(seconds));
  const hours=Math.floor(safe/3600),minutes=Math.floor((safe%3600)/60),secs=safe%60;
  if(languageTag.toLowerCase().startsWith('fr')){
    const parts:string[]=[];if(hours)parts.push(`${hours} heure${hours>1?'s':''}`);if(minutes)parts.push(`${minutes} minute${minutes>1?'s':''}`);if(secs||!parts.length)parts.push(`${secs} seconde${secs>1?'s':''}`);return parts.join(' et ');
  }
  const parts:string[]=[];if(hours)parts.push(`${hours} hour${hours>1?'s':''}`);if(minutes)parts.push(`${minutes} minute${minutes>1?'s':''}`);if(secs||!parts.length)parts.push(`${secs} second${secs>1?'s':''}`);return parts.join(' and ');
}
