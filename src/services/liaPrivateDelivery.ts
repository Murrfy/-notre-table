import type {LiaPrivacyChannelContext} from '../lib/liaPrivacyChannel';
import {chooseLiaPrivacyChannel} from '../lib/liaPrivacyChannel';
import {saveLiaPrivateMessage,type LiaPrivateMessage} from './liaPrivateInbox';
import {scheduleLiaPrivateNotification,type LiaPrivateNotificationCopy} from './notifications';

export type LiaPrivateDeliveryResult=
  |{status:'silent';channel:'silent';message:null;notification:'not-requested'}
  |{status:'stored';channel:'private_screen';message:LiaPrivateMessage;notification:'not-requested'}
  |{status:'stored';channel:'private_notification';message:LiaPrivateMessage;notification:'scheduled'|'permission-denied'}
  |{status:'voice-not-private';channel:'voice';message:null;notification:'not-requested'};

/**
 * Orchestrates the privacy boundary only. The private text is written to the
 * owner-scoped inbox first. Notification scheduling receives only the message
 * id and generic preview copy; it never receives the private text.
 */
export async function deliverLiaPrivateResult(input:{
  ownerId:string;
  privateText:string;
  privacy:LiaPrivacyChannelContext;
  notificationCopy:LiaPrivateNotificationCopy;
  now?:Date;
}):Promise<LiaPrivateDeliveryResult>{
  const channel=chooseLiaPrivacyChannel(input.privacy);
  if(channel==='silent')return{status:'silent',channel,message:null,notification:'not-requested'};
  if(channel==='voice')return{status:'voice-not-private',channel,message:null,notification:'not-requested'};
  const message=await saveLiaPrivateMessage({ownerId:input.ownerId,text:input.privateText,now:input.now});
  if(channel==='private_screen')return{status:'stored',channel,message,notification:'not-requested'};
  const notification=await scheduleLiaPrivateNotification(message.id,input.notificationCopy);
  return{status:'stored',channel,message,notification};
}
