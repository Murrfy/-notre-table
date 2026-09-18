import { supabase } from '../lib/supabase';
import { isArray, isRecord, readStoredJson, writeStoredJson } from '../lib/storage';

export type LiaMemoStatus='active'|'done';
export type LiaMemoLinkKind='restaurant'|'recipe'|'meal'|'shopping'|'commander'|'family'|'other';
export type LiaMemoLink={kind:LiaMemoLinkKind;ref?:string|null;label:string};
export type LiaMemo={id:string;title:string;summary:string;status:LiaMemoStatus;link_kind:LiaMemoLinkKind|null;link_ref:string|null;link_label:string|null;created_at:string;updated_at:string};

const DEMO_MEMOS_KEY='@notre-table/lia-memos-demo-v1';

function validMemo(value:unknown):value is LiaMemo{
  if(!isRecord(value))return false;
  const linkKind=value.link_kind;const linkRef=value.link_ref;const linkLabel=value.link_label;
  const linkValid=(linkKind===undefined&&linkRef===undefined&&linkLabel===undefined)||(linkKind===null&&linkRef===null&&linkLabel===null)||((linkKind==='restaurant'||linkKind==='recipe'||linkKind==='meal'||linkKind==='shopping'||linkKind==='commander'||linkKind==='family'||linkKind==='other')&&(linkRef===null||linkRef===undefined||typeof linkRef==='string')&&typeof linkLabel==='string');
  return typeof value.id==='string'&&typeof value.title==='string'&&typeof value.summary==='string'&&(value.status==='active'||value.status==='done')&&linkValid&&typeof value.created_at==='string'&&typeof value.updated_at==='string';
}
function validMemoList(value:unknown):value is LiaMemo[]{return isArray(value)&&value.every(validMemo);}
function localId(){return `memo-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}
async function localList(){const rows=await readStoredJson<LiaMemo[]>(DEMO_MEMOS_KEY,[],validMemoList);return rows.map(row=>({...row,link_kind:row.link_kind??null,link_ref:row.link_ref??null,link_label:row.link_label??null}));}
async function localWrite(rows:LiaMemo[]){await writeStoredJson(DEMO_MEMOS_KEY,rows);}

export async function listLiaMemos(demo=false):Promise<LiaMemo[]>{
  if(demo||!supabase)return localList();
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_memos').select('id,title,summary,status,link_kind,link_ref,link_label,created_at,updated_at').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error)throw error;return (data??[]) as LiaMemo[];
}

export async function createLiaMemo(input:{title:string;summary:string;link?:LiaMemoLink|null},demo=false):Promise<LiaMemo>{
  const title=input.title.trim();const summary=input.summary.trim();const link=input.link?{kind:input.link.kind,ref:input.link.ref?.trim()||null,label:input.link.label.trim()}:null;
  if(!title||!summary)throw new Error('MEMO_REQUIRED');
  if(link&&!link.label)throw new Error('MEMO_LINK_LABEL_REQUIRED');
  if(demo||!supabase){
    const now=new Date().toISOString();const memo:LiaMemo={id:localId(),title,summary,status:'active',link_kind:link?.kind??null,link_ref:link?.ref??null,link_label:link?.label??null,created_at:now,updated_at:now};
    const rows=await localList();await localWrite([memo,...rows]);return memo;
  }
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;if(!user)throw new Error('AUTH_REQUIRED');
  const {data,error}=await supabase.from('lia_memos').insert({user_id:user.id,title,summary,link_kind:link?.kind??null,link_ref:link?.ref??null,link_label:link?.label??null}).select('id,title,summary,status,link_kind,link_ref,link_label,created_at,updated_at').single();
  if(error)throw error;return data as LiaMemo;
}

export async function setLiaMemoStatus(id:string,status:LiaMemoStatus,demo=false):Promise<void>{
  if(demo||!supabase){const rows=await localList();await localWrite(rows.map(row=>row.id===id?{...row,status,updated_at:new Date().toISOString()}:row));return;}
  const {error}=await supabase.from('lia_memos').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;
}

export async function deleteLiaMemo(id:string,demo=false):Promise<void>{
  if(demo||!supabase){const rows=await localList();await localWrite(rows.filter(row=>row.id!==id));return;}
  const {error}=await supabase.from('lia_memos').delete().eq('id',id);if(error)throw error;
}
