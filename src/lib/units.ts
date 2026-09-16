import { UnitCode, normalizeUnit } from '../domain/catalog';

const metricToImperial:Partial<Record<UnitCode,{unit:UnitCode;factor:number}>>={g:{unit:'oz',factor:0.0352739619},kg:{unit:'lb',factor:2.20462262},ml:{unit:'cup',factor:0.00422675284},l:{unit:'cup',factor:4.22675284}};
const imperialToMetric:Partial<Record<UnitCode,{unit:UnitCode;factor:number}>>={oz:{unit:'g',factor:28.3495231},lb:{unit:'kg',factor:0.45359237},cup:{unit:'ml',factor:236.5882365}};

export function convertQuantity(quantity:number|null|undefined,unit:string|null|undefined,target:'metric'|'imperial'):{quantity:number|null;unit:string|null}{
  if(quantity==null)return{quantity:null,unit:normalizeUnit(unit) as string|null};
  const normalized=normalizeUnit(unit);
  if(!normalized||typeof normalized!=='string')return{quantity,unit:normalized as string|null};
  const table=target==='imperial'?metricToImperial:imperialToMetric;
  const entry=table[normalized as UnitCode];
  if(!entry)return{quantity,unit:normalized};
  const converted=quantity*entry.factor;
  const rounded=converted>=10?Math.round(converted):Math.round(converted*10)/10;
  return{quantity:rounded,unit:entry.unit};
}
