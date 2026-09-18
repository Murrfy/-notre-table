import { normalizeAisle, type AisleCode } from '../domain/catalog';
import { canonicalIngredientKey } from '../domain/ingredients';
import { AppError } from './appError';
import { fetchWithTimeout } from './fetchWithTimeout';
import { runtimeConfig } from './runtimeConfig';

export type PantryRecognitionLevel='exact_product'|'ingredient'|'category'|'unknown';
export type PantryRecognitionSource='vision'|'ocr'|'barcode'|'catalog'|'memory';

export type PantryVisionItem={
  label:string;
  ingredientKey:string;
  confidence:number|null;
  aisle:AisleCode;
  recognitionLevel:PantryRecognitionLevel;
  sources:PantryRecognitionSource[];
  productCode:string|null;
  sourceText:string|null;
  detectedLanguage:string|null;
  quantity:number|null;
  unit:string|null;
  quantityConfidence:number|null;
  needsConfirmation:boolean;
};

type PantryVisionInput={
  base64?:string|null;
  mimeType?:string|null;
  demoMode?:boolean;
  displayLanguage?:string|null;
  regionCode?:string|null;
  sessionId?:string|null;
  photoIndex?:number|null;
};

const recognitionLevels=new Set<PantryRecognitionLevel>(['exact_product','ingredient','category','unknown']);
const recognitionSources=new Set<PantryRecognitionSource>(['vision','ocr','barcode','catalog','memory']);

function cleanText(value:unknown):string|null{
  const text=String(value??'').trim();
  return text||null;
}

function normalizeLevel(value:unknown,ingredientKey:string):PantryRecognitionLevel{
  const raw=String(value??'').trim() as PantryRecognitionLevel;
  if(recognitionLevels.has(raw))return raw;
  return ingredientKey?'ingredient':'unknown';
}

function normalizeSources(value:unknown):PantryRecognitionSource[]{
  const raw=Array.isArray(value)?value:[value];
  const seen=new Set<PantryRecognitionSource>();
  for(const entry of raw){
    const source=String(entry??'').trim() as PantryRecognitionSource;
    if(recognitionSources.has(source))seen.add(source);
  }
  return Array.from(seen);
}

function normalizeItem(value:any):PantryVisionItem|null{
  const label=String(value?.label??value?.displayLabel??value?.name??'').trim();
  if(!label)return null;
  const ingredientKey=String(value?.ingredientKey??value?.ingredient_key??canonicalIngredientKey(label)).trim();
  const rawConfidence=Number(value?.confidence);
  const confidence=Number.isFinite(rawConfidence)?Math.max(0,Math.min(1,rawConfidence)):null;
  const recognitionLevel=normalizeLevel(value?.recognitionLevel??value?.recognition_level,ingredientKey);
  const explicitConfirmation=typeof value?.needsConfirmation==='boolean'
    ?value.needsConfirmation
    :typeof value?.needs_confirmation==='boolean'?value.needs_confirmation:null;
  const needsConfirmation=explicitConfirmation??(recognitionLevel==='unknown'||(confidence!==null&&confidence<.62));
  const rawQuantity=Number(value?.quantity??value?.quantityEstimate??value?.quantity_estimate);
  const quantity=Number.isFinite(rawQuantity)&&rawQuantity>=0?rawQuantity:null;
  const unit=cleanText(value?.unit??value?.quantityUnit??value?.quantity_unit);
  const rawQuantityConfidence=Number(value?.quantityConfidence??value?.quantity_confidence);
  const quantityConfidence=Number.isFinite(rawQuantityConfidence)?Math.max(0,Math.min(1,rawQuantityConfidence)):null;
  return {
    label,
    ingredientKey,
    confidence,
    aisle:normalizeAisle(value?.aisle),
    recognitionLevel,
    sources:normalizeSources(value?.sources??value?.source),
    productCode:cleanText(value?.productCode??value?.product_code??value?.gtin??value?.barcode),
    sourceText:cleanText(value?.sourceText??value?.source_text??value?.ocrText??value?.ocr_text),
    detectedLanguage:cleanText(value?.detectedLanguage??value?.detected_language??value?.language),
    quantity,
    unit,
    quantityConfidence,
    needsConfirmation,
  };
}

function identity(item:PantryVisionItem):string{
  if(item.productCode)return `product:${item.productCode}`;
  if(item.ingredientKey)return `ingredient:${item.ingredientKey}`;
  return `label:${canonicalIngredientKey(item.label)}`;
}

function recognitionRank(level:PantryRecognitionLevel):number{
  if(level==='exact_product')return 4;
  if(level==='ingredient')return 3;
  if(level==='category')return 2;
  return 1;
}

function isBetter(candidate:PantryVisionItem,current:PantryVisionItem):boolean{
  const rankDelta=recognitionRank(candidate.recognitionLevel)-recognitionRank(current.recognitionLevel);
  if(rankDelta!==0)return rankDelta>0;
  return (candidate.confidence??-1)>(current.confidence??-1);
}

export function mergePantryVisionItems(current:PantryVisionItem[],next:PantryVisionItem[]):PantryVisionItem[]{
  const merged=new Map<string,PantryVisionItem>();
  for(const item of [...current,...next]){
    const key=identity(item);
    const existing=merged.get(key);
    if(!existing){merged.set(key,item);continue;}
    const best=isBetter(item,existing)?item:existing;
    const other=best===item?existing:item;
    const confidence=Math.max(best.confidence??-1,other.confidence??-1);
    const bestQuantityConfidence=best.quantityConfidence??-1;
    const otherQuantityConfidence=other.quantityConfidence??-1;
    const quantitySource=(other.quantity!=null&&otherQuantityConfidence>bestQuantityConfidence)?other:best.quantity!=null?best:other;
    merged.set(key,{
      ...best,
      confidence:confidence<0?null:confidence,
      sources:Array.from(new Set([...best.sources,...other.sources])),
      sourceText:best.sourceText??other.sourceText,
      detectedLanguage:best.detectedLanguage??other.detectedLanguage,
      productCode:best.productCode??other.productCode,
      // Never sum duplicate views of the same product. Keep the most reliable estimate.
      quantity:quantitySource.quantity,
      unit:quantitySource.unit,
      quantityConfidence:quantitySource.quantityConfidence,
      needsConfirmation:best.recognitionLevel==='unknown'||(confidence>=0&&confidence<.62)||Boolean(best.needsConfirmation&&other.needsConfirmation),
    });
  }
  return Array.from(merged.values());
}

export async function scanPantryPhoto(input:PantryVisionInput):Promise<PantryVisionItem[]> {
  if(input.demoMode){
    await new Promise(resolve=>setTimeout(resolve,500));
    return [
      {label:'Courgettes',ingredientKey:'zucchini',confidence:.97,aisle:'produce',recognitionLevel:'ingredient',sources:['vision'],productCode:null,sourceText:null,detectedLanguage:'fr',quantity:3,unit:'piece',quantityConfidence:.78,needsConfirmation:false},
      {label:'Œufs',ingredientKey:'egg',confidence:.96,aisle:'fresh',recognitionLevel:'ingredient',sources:['vision'],productCode:null,sourceText:null,detectedLanguage:'fr',quantity:6,unit:'piece',quantityConfidence:.92,needsConfirmation:false},
      {label:'Mozzarella',ingredientKey:'mozzarella',confidence:.91,aisle:'fresh',recognitionLevel:'ingredient',sources:['vision','ocr'],productCode:null,sourceText:'Mozzarella',detectedLanguage:'it',quantity:1,unit:'ball',quantityConfidence:.75,needsConfirmation:false},
      {label:'Tomates',ingredientKey:'tomato',confidence:.89,aisle:'produce',recognitionLevel:'ingredient',sources:['vision'],productCode:null,sourceText:null,detectedLanguage:'fr',quantity:4,unit:'piece',quantityConfidence:.76,needsConfirmation:false},
      {label:'Yaourt',ingredientKey:'yogurt',confidence:.84,aisle:'fresh',recognitionLevel:'category',sources:['vision','ocr'],productCode:null,sourceText:'Yaourt',detectedLanguage:'fr',quantity:null,unit:null,quantityConfidence:null,needsConfirmation:false},
    ];
  }
  const endpoint=runtimeConfig.pantryVisionEndpoint;
  if(!endpoint)throw new AppError('pantry.photo.visionNotConfigured');
  if(!input.base64)throw new AppError('pantry.photo.prepareFailed');
  let response:Response;
  try{
    response=await fetchWithTimeout(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        imageBase64:input.base64,
        mimeType:input.mimeType||'image/jpeg',
        context:{
          displayLanguage:input.displayLanguage??null,
          regionCode:input.regionCode??null,
          sessionId:input.sessionId??null,
          photoIndex:input.photoIndex??null,
        },
        capabilities:['vision','ocr','barcode','catalog','memory'],
        output:{ingredientKey:'language-neutral',maxItems:60,estimateQuantity:true,quantityConfidence:true},
      }),
    },20000);
  }catch{
    throw new AppError('pantry.photo.visionUnavailable',{status:'network'});
  }
  if(!response.ok)throw new AppError('pantry.photo.visionUnavailable',{status:response.status});
  const payload=await response.json();
  const raw=Array.isArray(payload)?payload:Array.isArray(payload?.items)?payload.items:[];
  const items=raw.map(normalizeItem).filter(Boolean) as PantryVisionItem[];
  if(!items.length)throw new AppError('pantry.photo.noItems');
  return items;
}
