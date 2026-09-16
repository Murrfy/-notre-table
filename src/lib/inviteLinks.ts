import * as Linking from 'expo-linking';

export function normalizeInviteCode(value:unknown):string|null{
  const code=String(value??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  return code.length===6?code:null;
}

export function inviteLinkForCode(code:string):string{
  const normalized=normalizeInviteCode(code);
  if(!normalized)throw new Error('INVALID_INVITE_CODE');
  return Linking.createURL('join',{queryParams:{code:normalized}});
}

export function inviteCodeFromUrl(url:string|null|undefined):string|null{
  if(!url)return null;
  try{
    const parsed=Linking.parse(url);
    const route=[parsed.hostname,parsed.path].filter(Boolean).join('/').toLowerCase();
    if(!route.includes('join'))return null;
    const raw=Array.isArray(parsed.queryParams?.code)?parsed.queryParams?.code[0]:parsed.queryParams?.code;
    return normalizeInviteCode(raw);
  }catch{return null;}
}
