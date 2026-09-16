import type { Session } from '@supabase/supabase-js';
import { parseAuthLink } from '../lib/authLinks';
import { supabase } from '../lib/supabase';

export type AuthLinkResult={handled:boolean;recovery:boolean;session:Session|null};

export async function consumeAuthLink(url:string):Promise<AuthLinkResult>{
  const parsed=parseAuthLink(url);
  if(!parsed.handled)return {handled:false,recovery:false,session:null};
  if(parsed.errorDescription)throw new Error(parsed.errorDescription);
  if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');
  if(parsed.code){
    const {data,error}=await supabase.auth.exchangeCodeForSession(parsed.code);
    if(error)throw error;
    return {handled:true,recovery:parsed.recovery,session:data.session};
  }
  if(parsed.accessToken&&parsed.refreshToken){
    const {data,error}=await supabase.auth.setSession({access_token:parsed.accessToken,refresh_token:parsed.refreshToken});
    if(error)throw error;
    return {handled:true,recovery:parsed.recovery,session:data.session};
  }
  if(parsed.tokenHash&&parsed.type){
    const {data,error}=await supabase.auth.verifyOtp({token_hash:parsed.tokenHash,type:parsed.type as any});
    if(error)throw error;
    return {handled:true,recovery:parsed.recovery,session:data.session};
  }
  return {handled:true,recovery:parsed.recovery,session:null};
}
