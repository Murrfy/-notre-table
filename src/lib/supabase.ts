import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { runtimeConfig } from './runtimeConfig';

export const isSupabaseConfigured = runtimeConfig.supabase.enabled;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(runtimeConfig.supabase.url!, runtimeConfig.supabase.publishableKey!, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
