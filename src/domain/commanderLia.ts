export type CommanderLiaAction=
  |{kind:'next'}
  |{kind:'previous'}
  |{kind:'open_current'}
  |{kind:'open_index';index:number}
  |{kind:'another'}
  |{kind:'unknown'};

function normalize(input:string){
  return input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[׳״']/g,'').replace(/\s+/g,' ');
}

const ordinalWords:Record<string,number>={
  'premier':1,'premiere':1,'1er':1,'1ere':1,'first':1,'primero':1,'primera':1,'ראשון':1,'ראשונה':1,
  'deuxieme':2,'second':2,'seconde':2,'2e':2,'secondo':2,'segunda':2,'segundo':2,'שני':2,'שניה':2,'שנייה':2,
  'troisieme':3,'3e':3,'third':3,'tercero':3,'tercera':3,'שלישי':3,'שלישית':3,
  'quatrieme':4,'4e':4,'fourth':4,'cuarto':4,'cuarta':4,'רביעי':4,'רביעית':4,
  'cinquieme':5,'5e':5,'fifth':5,'quinto':5,'quinta':5,'חמישי':5,'חמישית':5,
  'sixieme':6,'6e':6,'sixth':6,'sexto':6,'sexta':6,'שישי':6,'שישית':6,
  'septieme':7,'7e':7,'seventh':7,'septimo':7,'septima':7,'שביעי':7,'שביעית':7,
  'huitieme':8,'8e':8,'eighth':8,'octavo':8,'octava':8,'שמיני':8,'שמינית':8,
};

export function parseCommanderLiaCommand(input:string):CommanderLiaAction{
  const value=normalize(input);
  if(!value)return{kind:'unknown'};
  if(/^(suivant|suivante|next|siguiente|הבא|הבאה)$/.test(value))return{kind:'next'};
  if(/^(precedent|precedente|previous|prev|anterior|הקודם|הקודמת)$/.test(value))return{kind:'previous'};
  if(/^(autre chose|un autre|une autre|something else|another|otra cosa|otro|otra|משהו אחר)$/.test(value))return{kind:'another'};
  if(/^(ouvre celui-la|ouvre celui la|ouvre celle-la|ouvre celle la|ouvre le|open this|open it|abre este|abre esta|abrelo|abrela|פתח את זה|תפתחי את זה)$/.test(value))return{kind:'open_current'};

  const digit=value.match(/(?:ouvre|open|abre|פתח|תפתחי)?\s*(?:le|la|the|el|la)?\s*(\d{1,2})(?:e|eme|er|ere|st|nd|rd|th)?\b/);
  if(digit){const index=Number(digit[1])-1;if(index>=0&&index<8)return{kind:'open_index',index};}
  for(const[word,position]of Object.entries(ordinalWords)){
    if(value===word||value.endsWith(` ${word}`)||value.includes(` ${word} `))return{kind:'open_index',index:position-1};
  }
  return{kind:'unknown'};
}

export function nextCommanderIndex(current:number,total:number,direction:'next'|'previous'|'another'){
  if(total<=0)return 0;
  const safe=Math.max(0,Math.min(total-1,current));
  if(direction==='previous')return(safe-1+total)%total;
  return(safe+1)%total;
}

export function nextUnseenCommanderIndex(rows:Array<{id:string}>,current:number,seenIds:Iterable<string>){
  if(rows.length<=0)return 0;
  const safe=Math.max(0,Math.min(rows.length-1,current));
  const seen=new Set(seenIds);
  for(let offset=1;offset<=rows.length;offset++){
    const candidate=(safe+offset)%rows.length;
    if(!seen.has(rows[candidate].id))return candidate;
  }
  return(safe+1)%rows.length;
}
