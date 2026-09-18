export type AppEnvironment = 'development' | 'preview' | 'production';

export type RuntimeConfig = {
  environment: AppEnvironment;
  allowDemo: boolean;
  supabase: {
    enabled: boolean;
    url?: string;
    publishableKey?: string;
    reason?: string;
  };
  recipeOcrEndpoint?: string;
  commanderLiveProvider: 'disabled' | 'supabase-edge';
  pantryVisionEndpoint?: string;
  accountDeletionEndpoint?: string;
  accountDeletionWebUrl?: string;
  privacyPolicyUrl?: string;
  googleNavigation: {
    enabled: boolean;
    iosApiKey?: string;
    reason?: string;
  };
  revenueCat: {
    enabled: boolean;
    iosApiKey?: string;
    androidApiKey?: string;
    entitlementId?: string;
    reason?: string;
  };
};

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return false;
  return /YOUR_|example\.com|YOUR_PROJECT/i.test(value);
}

function isUnsafePublicKey(value: string | undefined): boolean {
  if (!value) return false;
  // Never allow a privileged server key to be exposed through EXPO_PUBLIC_*.
  return /service[_-]?role/i.test(value) || /^sb_secret_/i.test(value);
}

function isSupportedPublishableKey(value: string | undefined): boolean {
  // Notre Table deliberately refuses legacy JWT API keys in shipped/public config.
  // A legacy JWT can represent either anon or service_role; requiring the modern
  // publishable prefix removes that ambiguity before a mobile bundle is built.
  return Boolean(value && /^sb_publishable_[A-Za-z0-9_-]+$/.test(value));
}



function resolveGoogleNavigationConfig(env: Record<string, string | undefined>): RuntimeConfig['googleNavigation'] {
  const iosApiKey=clean(env.EXPO_PUBLIC_GOOGLE_NAVIGATION_IOS_API_KEY);
  if(!iosApiKey)return{enabled:false,reason:'GOOGLE_NAVIGATION_NOT_CONFIGURED'};
  if(isPlaceholder(iosApiKey))return{enabled:false,reason:'GOOGLE_NAVIGATION_PLACEHOLDER_KEY'};
  if(!/^AIza[0-9A-Za-z_-]{20,}$/.test(iosApiKey))return{enabled:false,reason:'GOOGLE_NAVIGATION_IOS_KEY_INVALID'};
  return{enabled:true,iosApiKey};
}

function resolveRevenueCatConfig(env: Record<string, string | undefined>): RuntimeConfig['revenueCat'] {
  const iosApiKey = clean(env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY);
  const androidApiKey = clean(env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY);
  const entitlementId = clean(env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID);
  const supplied = Boolean(iosApiKey || androidApiKey || entitlementId);
  if (!supplied) return { enabled: false, reason: 'REVENUECAT_NOT_CONFIGURED' };
  if (!iosApiKey || !androidApiKey || !entitlementId) return { enabled: false, reason: 'REVENUECAT_CONFIG_INCOMPLETE' };
  if (/^sk_/i.test(iosApiKey) || /^sk_/i.test(androidApiKey)) return { enabled: false, reason: 'REVENUECAT_SECRET_KEY_FORBIDDEN' };
  if (!/^appl_[A-Za-z0-9_-]+$/.test(iosApiKey)) return { enabled: false, reason: 'REVENUECAT_IOS_PUBLIC_KEY_REQUIRED' };
  if (!/^goog_[A-Za-z0-9_-]+$/.test(androidApiKey)) return { enabled: false, reason: 'REVENUECAT_ANDROID_PUBLIC_KEY_REQUIRED' };
  if (!/^[A-Za-z0-9._-]+$/.test(entitlementId)) return { enabled: false, reason: 'REVENUECAT_ENTITLEMENT_INVALID' };
  return { enabled: true, iosApiKey, androidApiKey, entitlementId };
}

function resolveEnvironment(value: string | undefined): AppEnvironment {
  const normalized = clean(value)?.toLowerCase();
  if (normalized === 'production') return 'production';
  if (normalized === 'preview') return 'preview';
  return 'development';
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
  const environment = resolveEnvironment(env.EXPO_PUBLIC_APP_ENV);
  const allowDemo = environment !== 'production';
  const url = clean(env.EXPO_PUBLIC_SUPABASE_URL);
  const key = clean(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const recipeOcrEndpoint = clean(env.EXPO_PUBLIC_RECIPE_OCR_ENDPOINT);
  const pantryVisionEndpoint = clean(env.EXPO_PUBLIC_PANTRY_VISION_ENDPOINT);
  const accountDeletionEndpoint = clean(env.EXPO_PUBLIC_ACCOUNT_DELETION_ENDPOINT);
  const accountDeletionWebUrl = clean(env.EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL);
  const privacyPolicyUrl = clean(env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
  const commanderLiveProvider = clean(env.EXPO_PUBLIC_COMMANDER_LIVE_PROVIDER) === 'supabase-edge' ? 'supabase-edge' : 'disabled';

  let enabled = false;
  let reason: string | undefined;
  if (!url && !key) reason = 'SUPABASE_NOT_CONFIGURED';
  else if (!url || !key) reason = 'SUPABASE_CONFIG_INCOMPLETE';
  else if (isPlaceholder(url) || isPlaceholder(key)) reason = 'SUPABASE_PLACEHOLDER_VALUES';
  else if (!isHttpsUrl(url)) reason = 'SUPABASE_URL_INVALID';
  else if (isUnsafePublicKey(key)) reason = 'SUPABASE_PRIVILEGED_KEY_FORBIDDEN';
  else if (!isSupportedPublishableKey(key)) reason = 'SUPABASE_PUBLISHABLE_KEY_REQUIRED';
  else enabled = true;

  return {
    environment,
    allowDemo,
    supabase: enabled ? { enabled: true, url, publishableKey: key } : { enabled: false, reason },
    recipeOcrEndpoint: recipeOcrEndpoint && isHttpsUrl(recipeOcrEndpoint) ? recipeOcrEndpoint : undefined,
    commanderLiveProvider,
    pantryVisionEndpoint: pantryVisionEndpoint && isHttpsUrl(pantryVisionEndpoint) ? pantryVisionEndpoint : undefined,
    accountDeletionEndpoint: accountDeletionEndpoint && !isPlaceholder(accountDeletionEndpoint) && isHttpsUrl(accountDeletionEndpoint) ? accountDeletionEndpoint : undefined,
    accountDeletionWebUrl: accountDeletionWebUrl && !isPlaceholder(accountDeletionWebUrl) && isHttpsUrl(accountDeletionWebUrl) ? accountDeletionWebUrl : undefined,
    privacyPolicyUrl: privacyPolicyUrl && !isPlaceholder(privacyPolicyUrl) && isHttpsUrl(privacyPolicyUrl) ? privacyPolicyUrl : undefined,
    googleNavigation: resolveGoogleNavigationConfig(env),
    revenueCat: resolveRevenueCatConfig(env),
  };
}

export const runtimeConfig = resolveRuntimeConfig();
