import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { getCalendars, getLocales } from 'expo-localization';
import { getLocalePreferences, LocalePreferences, saveLocalePreferences } from '../services/appPreferences';
import { SupportedLanguage, supportedLanguages, translate, TranslationKey } from '../i18n';

export type MeasurementPreference = 'system' | 'metric' | 'imperial';
export type ResolvedLocale = {
  language: SupportedLanguage;
  languageTag: string;
  regionCode: string | null;
  currencyCode: string | null;
  measurementSystem: 'metric' | 'imperial';
  textDirection: 'ltr' | 'rtl';
  timeZone: string;
  uses24hourClock: boolean;
  firstWeekday: number;
};

type LocaleContextValue = ResolvedLocale & {
  preference: LocalePreferences;
  setLanguage: (language:LocalePreferences['language'])=>Promise<void>;
  setMeasurement: (measurement:MeasurementPreference)=>Promise<void>;
  t: (key:TranslationKey,vars?:Record<string,string|number>)=>string;
  formatDate: (date:Date,options?:Intl.DateTimeFormatOptions)=>string;
  formatNumber: (value:number,options?:Intl.NumberFormatOptions)=>string;
  formatCurrency: (value:number,currency?:string)=>string;
};

const LocaleContext=createContext<LocaleContextValue|null>(null);
const supported=new Set<SupportedLanguage>(supportedLanguages.map(x=>x.code));

function resolve(preference:LocalePreferences):ResolvedLocale {
  const locale=getLocales()[0];
  const calendar=getCalendars()[0];
  const deviceLanguage=(locale.languageCode ?? 'en') as SupportedLanguage;
  const language=preference.language==='system'?(supported.has(deviceLanguage)?deviceLanguage:'en'):preference.language;
  const fallbackTag:Record<SupportedLanguage,string>={fr:'fr-FR',en:'en-US',es:'es-ES',he:'he-IL'};
  const languageTag=preference.language==='system'?(locale.languageTag||fallbackTag[language]):fallbackTag[language];
  const deviceMeasurement=locale.measurementSystem==='us'||locale.measurementSystem==='uk'?'imperial':'metric';
  const measurementSystem=preference.measurement==='system'?deviceMeasurement:preference.measurement;
  const rtl=supportedLanguages.find(x=>x.code===language)?.rtl ?? false;
  return {language,languageTag,regionCode:locale.regionCode??null,currencyCode:locale.currencyCode??null,measurementSystem,textDirection:rtl?'rtl':'ltr',timeZone:calendar.timeZone??'UTC',uses24hourClock:Boolean(calendar.uses24hourClock),firstWeekday:calendar.firstWeekday??1};
}

export function LocaleProvider({children}:{children:React.ReactNode}){
  const [preference,setPreference]=useState<LocalePreferences>({language:'system',measurement:'system'});
  const [ready,setReady]=useState(false);
  const [environmentRevision,setEnvironmentRevision]=useState(0);
  useEffect(()=>{getLocalePreferences().then(setPreference).finally(()=>setReady(true));},[]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>{if(state==='active')setEnvironmentRevision(value=>value+1);});
    return()=>subscription.remove();
  },[]);
  const resolved=useMemo(()=>resolve(preference),[preference,environmentRevision]);
  const setLanguage=async(language:LocalePreferences['language'])=>{const next={...preference,language};setPreference(next);await saveLocalePreferences(next);};
  const setMeasurement=async(measurement:MeasurementPreference)=>{const next={...preference,measurement};setPreference(next);await saveLocalePreferences(next);};
  const value=useMemo<LocaleContextValue>(()=>({...resolved,preference,setLanguage,setMeasurement,t:(key,vars)=>translate(resolved.language,key,vars),formatDate:(date,options)=>new Intl.DateTimeFormat(resolved.languageTag,options).format(date),formatNumber:(value,options)=>new Intl.NumberFormat(resolved.languageTag,options).format(value),formatCurrency:(value,currency)=>new Intl.NumberFormat(resolved.languageTag,{style:'currency',currency:currency??resolved.currencyCode??'EUR'}).format(value)}),[resolved,preference]);
  if(!ready)return null;
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(){const value=useContext(LocaleContext);if(!value)throw new Error('useLocale must be used inside LocaleProvider');return value;}
