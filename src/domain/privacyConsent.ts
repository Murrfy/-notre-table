export type ConsentDecision='unknown'|'granted'|'denied';

export type PrivacyConsentState={
  analytics:ConsentDecision;
  adsPersonalization:ConsentDecision;
  preciseLocation:ConsentDecision;
};

export const DEFAULT_PRIVACY_CONSENT:PrivacyConsentState={
  analytics:'unknown',
  adsPersonalization:'unknown',
  preciseLocation:'unknown',
};

export function mayUseAnalytics(consent:PrivacyConsentState){return consent.analytics==='granted';}
export function mayUsePersonalizedAds(consent:PrivacyConsentState){return consent.adsPersonalization==='granted';}
export function mayUsePreciseLocation(consent:PrivacyConsentState){return consent.preciseLocation==='granted';}
