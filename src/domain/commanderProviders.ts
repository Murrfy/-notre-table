import type {CommanderOrderPath,CommanderPlace} from './commander';

function normalize(value?:string|null){return (value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function normalizePhone(value?:string|null){return (value??'').replace(/\D/g,'');}

export function commanderIdentityKeys(place:CommanderPlace){
  const keys:string[]=[];
  const source=normalize(place.source),id=normalize(place.id),phone=normalizePhone(place.phone),name=normalize(place.name),address=normalize(place.address);
  if(source&&id)keys.push(`source:${source}:${id}`);
  if(phone.length>=7)keys.push(`phone:${phone}`);
  if(name&&address)keys.push(`name-address:${name}|${address}`);
  return keys;
}

function mergeOrderPaths(a:ReadonlyArray<CommanderOrderPath>|undefined,b:ReadonlyArray<CommanderOrderPath>|undefined){
  const map=new Map<string,CommanderOrderPath>();
  for(const path of [...(a??[]),...(b??[])])if(path?.id&&!map.has(path.id))map.set(path.id,path);
  return [...map.values()];
}

/**
 * Merge exact identities from multiple catalog sources without allowing a
 * secondary source to silently replace the canonical row chosen first.
 * Missing descriptive fields may be filled, categories/order paths may be
 * combined, while delivery truth remains the responsibility of the separate
 * delivery verification layer.
 */
export function mergeCommanderPlaceSources(rows:ReadonlyArray<CommanderPlace>):CommanderPlace[]{
  const result:CommanderPlace[]=[];const keyToIndex=new Map<string,number>();
  for(const row of rows){
    const keys=commanderIdentityKeys(row);let index=keys.map(key=>keyToIndex.get(key)).find(value=>typeof value==='number');
    if(typeof index!=='number'){
      index=result.length;result.push({...row,categories:[...new Set(row.categories)],orderPaths:mergeOrderPaths(row.orderPaths,undefined)});
    }else{
      const base=result[index];
      result[index]={
        ...base,
        categories:[...new Set([...base.categories,...row.categories])],
        sourceAttribution:base.sourceAttribution??row.sourceAttribution,
        phone:base.phone??row.phone,
        imageUrl:base.imageUrl??row.imageUrl,
        address:base.address??row.address,
        rating:base.rating??row.rating,
        ratingCount:base.ratingCount??row.ratingCount,
        orderPaths:mergeOrderPaths(base.orderPaths,row.orderPaths),
      };
    }
    for(const key of keys)if(!keyToIndex.has(key))keyToIndex.set(key,index);
  }
  return result;
}

export function selectCommanderOrderPath(paths:ReadonlyArray<CommanderOrderPath>|undefined,preferredId?:string|null){
  if(!paths?.length)return null;
  if(preferredId){const preferred=paths.find(path=>path.id===preferredId);if(preferred)return preferred;}
  return paths.find(path=>path.kind==='official')??paths.find(path=>path.kind==='platform')??paths.find(path=>path.kind==='phone')??null;
}
