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


export function parseLiaDislikedFoodAnswer(text:string):string|null{
  const raw=text.trim().replace(/[.!?]+$/g,'').trim();
  if(!raw)return null;
  let value=raw
    .replace(/^(?:elle\s+d[eé]teste|il\s+d[eé]teste|je\s+d[eé]teste|elle\s+n['’]?aime\s+pas|il\s+n['’]?aime\s+pas|je\s+n['’]?aime\s+pas|elle\s+ne\s+supporte\s+pas|il\s+ne\s+supporte\s+pas|je\s+ne\s+supporte\s+pas|she\s+hates|he\s+hates|i\s+hate|she\s+doesn['’]?t\s+like|he\s+doesn['’]?t\s+like|i\s+don['’]?t\s+like)\s+/i,'')
    .replace(/^(?:le|la|les|du|de\s+la|des|un|une|the|a|an)\s+/i,'')
    .replace(/\s+/g,' ')
    .slice(0,80)
    .trim();
  if(value.length<2)return null;
  const folded=normalized(value);
  if(/^(?:oui|non|yes|no|je\s+sais\s+pas|i\s+don\s+t\s+know|aucune\s+idee|none|rien|tout|nothing)$/.test(folded))return null;
  return value;
}
