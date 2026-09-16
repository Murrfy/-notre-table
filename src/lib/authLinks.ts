export type ParsedAuthLink={
  handled:boolean;
  recovery:boolean;
  accessToken?:string;
  refreshToken?:string;
  code?:string;
  tokenHash?:string;
  type?:string;
  errorDescription?:string;
};

function value(params:URLSearchParams,name:string):string|undefined{
  const raw=params.get(name);
  return raw&&raw.trim()?raw:undefined;
}

export function parseAuthLink(url:string):ParsedAuthLink{
  try{
    const parsed=new URL(url);
    const params=new URLSearchParams(parsed.search);
    const fragment=parsed.hash.startsWith('#')?parsed.hash.slice(1):parsed.hash;
    if(fragment){
      const hashParams=new URLSearchParams(fragment);
      hashParams.forEach((v,k)=>{if(!params.has(k))params.set(k,v);});
    }
    const accessToken=value(params,'access_token');
    const refreshToken=value(params,'refresh_token');
    const code=value(params,'code');
    const tokenHash=value(params,'token_hash');
    const type=value(params,'type');
    const errorDescription=value(params,'error_description')||value(params,'error');
    const route=`/${parsed.hostname}${parsed.pathname}`.replace(/\/{2,}/g,'/');
    const authPath=/\/auth(?:\/|$)/i.test(route);
    const handled=Boolean(authPath||accessToken||refreshToken||code||tokenHash||errorDescription);
    const recovery=Boolean(type==='recovery'||/\/auth\/recovery(?:\/|$)/i.test(route));
    return {handled,recovery,accessToken,refreshToken,code,tokenHash,type,errorDescription};
  }catch{return {handled:false,recovery:false};}
}
