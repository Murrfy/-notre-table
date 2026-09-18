import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { getThemePreference, saveThemePreference, type ThemePreference } from '../services/appPreferences';

export type AppThemeMode = ThemePreference;

type ThemeContextValue = {
  preference: AppThemeMode;
  resolvedScheme: 'light' | 'dark';
  setPreference: (value: AppThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyAppearance(value: AppThemeMode) {
  Appearance.setColorScheme(value === 'system' ? 'unspecified' : value);
}

export function ThemeProvider({ children }:{children:React.ReactNode}) {
  const [preference,setPreferenceState]=useState<AppThemeMode>('system');
  const scheme=useColorScheme();

  useEffect(()=>{
    getThemePreference().then(value=>{
      setPreferenceState(value);
      applyAppearance(value);
    }).catch(()=>applyAppearance('system'));
  },[]);

  const setPreference=useCallback(async(value:AppThemeMode)=>{
    setPreferenceState(value);
    applyAppearance(value);
    await saveThemePreference(value);
  },[]);

  const resolvedScheme: 'light'|'dark' = scheme === 'dark' ? 'dark' : 'light';
  const value=useMemo(()=>({preference,resolvedScheme,setPreference}),[preference,resolvedScheme,setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(){
  const value=useContext(ThemeContext);
  if(!value) throw new Error('useAppTheme must be used inside ThemeProvider');
  return value;
}
