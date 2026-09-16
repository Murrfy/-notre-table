import { supabase } from '../lib/supabase';

const AVATAR_BUCKET='profile-avatars';

function decodeBase64(value:string):ArrayBuffer {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean=value.replace(/[^A-Za-z0-9+/=]/g,'');
  const bytes:number[]=[];
  let buffer=0;
  let bits=0;
  for(const char of clean){
    if(char==='=')break;
    const index=alphabet.indexOf(char);
    if(index<0)continue;
    buffer=(buffer<<6)|index;
    bits+=6;
    if(bits>=8){
      bits-=8;
      bytes.push((buffer>>bits)&0xff);
    }
  }
  return Uint8Array.from(bytes).buffer;
}

function extensionForMime(mimeType?:string|null):string{
  const mime=(mimeType??'image/jpeg').toLowerCase();
  if(mime.includes('png'))return'png';
  if(mime.includes('webp'))return'webp';
  if(mime.includes('heic')||mime.includes('heif'))return'heic';
  return'jpg';
}


export type MyProfile={id:string;display_name:string;avatar_path:string|null;avatar_url:string|null};

export async function getMyProfile():Promise<MyProfile>{
  if(!supabase)return{id:'u1',display_name:'You',avatar_path:null,avatar_url:null};
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('NOT_AUTHENTICATED');
  const {data,error}=await supabase.from('profiles').select('display_name,avatar_path,avatar_url').eq('id',user.id).maybeSingle();
  if(error)throw error;
  const avatarPath=(data?.avatar_path as string|undefined)??null;
  return {
    id:user.id,
    display_name:data?.display_name?.trim()||user.email?.split('@')[0]||'Member',
    avatar_path:avatarPath,
    avatar_url:avatarPath?await createAvatarSignedUrl(avatarPath):data?.avatar_url??null,
  };
}

export async function getMyDisplayName():Promise<string>{
  if(!supabase)return 'You';
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!userData.user)return '';
  const {data,error}=await supabase.from('profiles').select('display_name').eq('id',userData.user.id).maybeSingle();
  if(error)throw error;
  return data?.display_name?.trim()||userData.user.email?.split('@')[0]||'Member';
}

export async function updateMyDisplayName(displayName:string):Promise<void>{
  if(!supabase)throw new Error('DEMO_MODE');
  const name=displayName.trim();
  if(name.length<2||name.length>60)throw new Error('INVALID_DISPLAY_NAME');
  const {data:userData,error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!userData.user)throw new Error('NOT_AUTHENTICATED');
  const {error}=await supabase.from('profiles').update({display_name:name}).eq('id',userData.user.id);
  if(error)throw error;
}

export async function createAvatarSignedUrl(path:string|null|undefined,expiresIn=60*60):Promise<string|null>{
  if(!supabase||!path)return null;
  const {data,error}=await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path,expiresIn);
  if(error)return null;
  return data?.signedUrl??null;
}

export async function uploadMyAvatar(args:{base64:string;mimeType?:string|null}):Promise<{path:string;url:string|null}>{
  if(!supabase)throw new Error('DEMO_MODE');
  if(!args.base64)throw new Error('AVATAR_IMAGE_MISSING');
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('NOT_AUTHENTICATED');

  const {data:profile,error:profileError}=await supabase.from('profiles').select('avatar_path').eq('id',user.id).maybeSingle();
  if(profileError)throw profileError;
  const oldPath=profile?.avatar_path as string|undefined;
  const mimeType=args.mimeType||'image/jpeg';
  const path=`${user.id}/${Date.now()}.${extensionForMime(mimeType)}`;
  const body=decodeBase64(args.base64);
  const {error:uploadError}=await supabase.storage.from(AVATAR_BUCKET).upload(path,body,{contentType:mimeType,cacheControl:'3600',upsert:false});
  if(uploadError)throw uploadError;

  const {error:updateError}=await supabase.from('profiles').update({avatar_path:path,avatar_url:null}).eq('id',user.id);
  if(updateError){
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    throw updateError;
  }
  if(oldPath&&oldPath!==path)await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  return {path,url:await createAvatarSignedUrl(path)};
}

export async function removeMyAvatar():Promise<void>{
  if(!supabase)throw new Error('DEMO_MODE');
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('NOT_AUTHENTICATED');
  const {data:profile,error:profileError}=await supabase.from('profiles').select('avatar_path').eq('id',user.id).maybeSingle();
  if(profileError)throw profileError;
  const path=profile?.avatar_path as string|undefined;
  const {error:updateError}=await supabase.from('profiles').update({avatar_path:null,avatar_url:null}).eq('id',user.id);
  if(updateError)throw updateError;
  if(path)await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}
