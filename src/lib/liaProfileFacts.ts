function normalized(value:string):string{
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
}

export function parseLiaFavoriteMealAnswer(text:string):string|null{
  const raw=text.trim().replace(/[.!?]+$/g,'').trim();
  if(!raw)return null;
  let value=raw
    .replace(/^(?:son\s+plat\s+pr[eé]f[eé]r[eé]\s+(?:c['’]?est|est)|son\s+pr[eé]f[eé]r[eé]\s+(?:c['’]?est|est)|elle\s+adore|il\s+adore|j['’]?adore|mon\s+plat\s+pr[eé]f[eé]r[eé]\s+(?:c['’]?est|est)|her\s+favorite\s+(?:dish|meal)\s+is|his\s+favorite\s+(?:dish|meal)\s+is|my\s+favorite\s+(?:dish|meal)\s+is|she\s+loves|he\s+loves|i\s+love)\s+/i,'')
    .replace(/^(?:le|la|les|du|de\s+la|des|un|une|the|a|an)\s+/i,'')
    .replace(/\s+/g,' ')
    .slice(0,120)
    .trim();
  if(value.length<2)return null;
  const folded=normalized(value);
  if(/^(?:oui|non|yes|no|je\s+sais\s+pas|i\s+don\s+t\s+know|aucune\s+idee|none|rien)$/.test(folded))return null;
  return value;
}
