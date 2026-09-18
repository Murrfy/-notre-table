export type LiaPrivacyChannel='voice'|'private_screen'|'private_notification'|'silent';

export type LiaPrivacyChannelContext={
  sensitive:boolean;
  othersMayHear:boolean;
  appOpen:boolean;
  socialSessionActive:boolean;
  proactive:boolean;
  userInitiated:boolean;
  quiet:boolean;
};

/**
 * Chooses only the delivery surface for a LIA response. It never decides the
 * content itself and never upgrades private information into a social reply.
 */
export function chooseLiaPrivacyChannel(input:LiaPrivacyChannelContext):LiaPrivacyChannel{
  if(input.quiet&&input.proactive&&!input.userInitiated)return 'silent';
  if(input.sensitive){
    return input.appOpen?'private_screen':'private_notification';
  }
  return 'voice';
}

export function liaMaySpeakSensitiveContent(input:LiaPrivacyChannelContext):boolean{
  return !input.sensitive&&chooseLiaPrivacyChannel(input)==='voice';
}

export function liaPrivatePreview(copy:string):string{
  return copy.trim();
}

export const LIA_PRIVACY_CHANNEL_POLICY={
  sensitiveVoice:false as const,
  socialModeCanOverrideSensitivity:false as const,
  ambientAudienceDoubtCanTriggerVoice:false as const,
  notificationCarriesPrivateDetail:false as const,
};
