import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import {DEFAULT_LIA_NAMING_CONTEXT,sanitizeLiaNickname,type LiaNamingContext} from '../lib/liaIdentity';

const KEY='@notre-table/lia-naming-v1';

function valid(value:unknown):value is LiaNamingContext{
  if(!isRecord(value))return false;
  const liaNickname=value.liaNickname;
  const userNickname=value.userNickname;
  return (liaNickname===null||typeof liaNickname==='string')
    &&(userNickname===null||typeof userNickname==='string')
    &&typeof value.userNicknameApproved==='boolean';
}

export async function getLiaNamingPreferences():Promise<LiaNamingContext>{
  const stored=await readStoredJson<LiaNamingContext>(KEY,DEFAULT_LIA_NAMING_CONTEXT,valid);
  return{
    liaNickname:sanitizeLiaNickname(stored.liaNickname??''),
    userNickname:sanitizeLiaNickname(stored.userNickname??''),
    userNicknameApproved:Boolean(stored.userNicknameApproved&&sanitizeLiaNickname(stored.userNickname??'')),
  };
}

export async function saveLiaNamingPreferences(value:LiaNamingContext):Promise<LiaNamingContext>{
  const safe:LiaNamingContext={
    liaNickname:sanitizeLiaNickname(value.liaNickname??''),
    userNickname:sanitizeLiaNickname(value.userNickname??''),
    userNicknameApproved:Boolean(value.userNicknameApproved&&sanitizeLiaNickname(value.userNickname??'')),
  };
  await writeStoredJson(KEY,safe);
  return safe;
}
