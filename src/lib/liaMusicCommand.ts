export type LiaMusicService='spotify'|'apple_music'|'youtube_music';
export type LiaMusicCommand={recognized:boolean;query:string|null;service:LiaMusicService|null};

function fold(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}

export function liaMusicServiceFromText(text:string):LiaMusicService|null{
  const s=fold(text);
  if(/\bspotify\b/.test(s))return'spotify';
  if(/\bapple\s+music\b|\bmusique\s+apple\b/.test(s))return'apple_music';
  if(/\byoutube\s+music\b/.test(s))return'youtube_music';
  return null;
}

function cleanQuery(value:string):string|null{
  const clean=value
    .replace(/\b(?:sur\s+)?(?:spotify|apple\s+music|musique\s+apple|youtube\s+music)\b/gi,' ')
    .replace(/^[\s,:;.!?\-]+|[\s,:;.!?\-]+$/g,'')
    .replace(/^(?:de|du|des|la|le|les|une|un)\s+/i,'')
    .replace(/\s+/g,' ')
    .trim();
  if(!clean||/^(?:de\s+)?(?:la\s+)?musique$/i.test(clean))return null;
  return clean;
}

export function parseLiaMusicCommand(text:string):LiaMusicCommand{
  const raw=text.trim();
  const service=liaMusicServiceFromText(raw);
  const patterns=[
    /^(?:tu\s+me\s+)?(?:mets|met|lance|joue)\s+(?:moi\s+)?(?:de\s+)?(?:la\s+)?musique(?:\s+(.+))?$/i,
    /^(?:tu\s+peux|peux[- ]?tu|est[- ]ce\s+que\s+tu)\s+(?:me\s+)?(?:mettre|lancer|jouer)\s+(?:de\s+)?(?:la\s+)?musique(?:\s+(.+))?$/i,
    /^(?:mets|met|lance|joue)\s+(?:moi\s+)?(?:la\s+chanson|le\s+morceau|l['’]album|la\s+playlist)\s+(.+)$/i,
    /^(?:mets|met|lance|joue)\s+(?:moi\s+)?(.+?)\s+(?:sur\s+)?(?:spotify|apple\s+music|musique\s+apple|youtube\s+music)$/i,
    /^(?:play)\s+(?:some\s+)?music(?:\s+(.+))?$/i,
    /^(?:play)\s+(.+?)\s+(?:on\s+)?(?:spotify|apple\s+music|youtube\s+music)$/i,
  ];
  for(const pattern of patterns){
    const match=raw.match(pattern);
    if(match)return{recognized:true,query:cleanQuery(match[1]??''),service};
  }
  if(service&&/^(?:ouvre|open)\s+(?:spotify|apple\s+music|musique\s+apple|youtube\s+music)$/i.test(raw))return{recognized:true,query:null,service};
  return{recognized:false,query:null,service:null};
}
