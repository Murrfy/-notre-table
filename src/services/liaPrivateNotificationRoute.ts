export type LiaPrivateNotificationData={screen?:unknown;messageId?:unknown};

export function liaPrivateMessageIdFromNotificationData(data:unknown):string|null{
  if(!data||typeof data!=='object')return null;
  const value=data as LiaPrivateNotificationData;
  if(value.screen!=='lia-private'||typeof value.messageId!=='string')return null;
  const messageId=value.messageId.trim();
  return messageId||null;
}
