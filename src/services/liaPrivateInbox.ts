import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';

const PRIVATE_INBOX_KEY='@notre-table/lia-private-inbox-v1';

export type LiaPrivateMessage={
  id:string;
  ownerId:string;
  createdAtIso:string;
  text:string;
  openedAtIso:string|null;
};

type StoredInbox={version:1;messages:LiaPrivateMessage[]};
const emptyInbox:StoredInbox={version:1,messages:[]};

function validMessage(value:unknown):value is LiaPrivateMessage{
  return isRecord(value)&&typeof value.id==='string'&&typeof value.ownerId==='string'&&
    typeof value.createdAtIso==='string'&&typeof value.text==='string'&&
    (value.openedAtIso===null||typeof value.openedAtIso==='string');
}
function validInbox(value:unknown):value is StoredInbox{
  return isRecord(value)&&value.version===1&&Array.isArray(value.messages)&&value.messages.every(validMessage);
}
async function readInbox(){return readStoredJson<StoredInbox>(PRIVATE_INBOX_KEY,emptyInbox,validInbox);}

export async function saveLiaPrivateMessage(input:{ownerId:string;text:string;now?:Date}):Promise<LiaPrivateMessage>{
  const ownerId=input.ownerId.trim();
  const text=input.text.trim();
  if(!ownerId||!text)throw new Error('PRIVATE_MESSAGE_INVALID');
  const now=input.now??new Date();
  const message:LiaPrivateMessage={
    id:`lia-private-${now.getTime()}-${Math.random().toString(36).slice(2,9)}`,
    ownerId,
    createdAtIso:now.toISOString(),
    text,
    openedAtIso:null,
  };
  const inbox=await readInbox();
  const messages=[message,...inbox.messages].slice(0,100);
  await writeStoredJson(PRIVATE_INBOX_KEY,{version:1,messages});
  return message;
}

export async function listLiaPrivateMessages(ownerId:string):Promise<LiaPrivateMessage[]>{
  const inbox=await readInbox();
  return inbox.messages.filter(message=>message.ownerId===ownerId);
}

export async function openLiaPrivateMessage(ownerId:string,messageId:string,now=new Date()):Promise<LiaPrivateMessage|null>{
  const inbox=await readInbox();
  let opened:LiaPrivateMessage|null=null;
  const messages=inbox.messages.map(message=>{
    if(message.ownerId!==ownerId||message.id!==messageId)return message;
    opened={...message,openedAtIso:message.openedAtIso??now.toISOString()};
    return opened;
  });
  if(opened)await writeStoredJson(PRIVATE_INBOX_KEY,{version:1,messages});
  return opened;
}
