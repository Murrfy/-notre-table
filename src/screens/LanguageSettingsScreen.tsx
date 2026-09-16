import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supportedLanguages } from '../i18n';
import { useLocale } from '../context/LocaleContext';
import { colors, radius } from '../theme';

export function LanguageSettingsScreen({onClose}:{onClose:()=>void}){
  const locale=useLocale();
  const languages=[{code:'system' as const,nativeLabel:locale.t('settings.system'),rtl:false},...supportedLanguages];
  const measurement=[['system','settings.measurementSystem'],['metric','settings.metric'],['imperial','settings.imperial']] as const;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={[styles.title,locale.textDirection==='rtl'&&styles.rtl]}>{locale.t('settings.language')}</Text><Text accessibilityRole="button" onPress={onClose} style={styles.close}>{locale.t('common.close')}</Text></View>
    <Text style={[styles.note,locale.textDirection==='rtl'&&styles.rtl]}>{locale.t('settings.languageNote')}</Text>
    <View style={styles.card}>{languages.map(item=><Pressable accessibilityRole="button" accessibilityState={{selected:locale.preference.language===item.code}} key={item.code} onPress={()=>locale.setLanguage(item.code)} style={styles.row}><Text style={[styles.rowText,item.rtl&&styles.rtl]}>{item.nativeLabel}</Text><Text style={styles.check}>{locale.preference.language===item.code?'✓':''}</Text></Pressable>)}</View>
    <Text style={[styles.section,locale.textDirection==='rtl'&&styles.rtl]}>{locale.t('settings.measurement')}</Text>
    <View style={styles.card}>{measurement.map(([value,key])=><Pressable accessibilityRole="button" accessibilityState={{selected:locale.preference.measurement===value}} key={value} onPress={()=>locale.setMeasurement(value)} style={styles.row}><Text style={styles.rowText}>{locale.t(key)}</Text><Text style={styles.check}>{locale.preference.measurement===value?'✓':''}</Text></Pressable>)}</View>
    <View style={styles.info}><Info label={locale.t('settings.region')} value={locale.regionCode??'—'}/><Info label={locale.t('settings.currency')} value={locale.currencyCode??'—'}/><Info label={locale.t('settings.firstDay')} value={String(locale.firstWeekday)}/></View>
    {locale.language==='he'?<Text style={styles.rtlHelp}>{locale.t('settings.restartRtl')}</Text>:null}
  </ScrollView></SafeAreaView>;
}
function Info({label,value}:{label:string;value:string}){return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},content:{padding:20,paddingBottom:40},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8},title:{fontSize:28,fontWeight:'900',color:colors.ink},close:{color:colors.sageDark,fontWeight:'900'},note:{color:colors.muted,fontSize:13,lineHeight:20,marginTop:12},section:{fontSize:12,fontWeight:'900',letterSpacing:1,color:colors.muted,marginTop:24,marginBottom:8},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,overflow:'hidden',marginTop:18},row:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:colors.border},rowText:{fontSize:15,fontWeight:'700',color:colors.ink},check:{fontSize:18,fontWeight:'900',color:colors.sageDark},info:{marginTop:22,backgroundColor:colors.sageSoft,borderRadius:radius.md,padding:14},infoRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:5},infoLabel:{color:colors.muted,fontSize:12,fontWeight:'700'},infoValue:{color:colors.ink,fontSize:12,fontWeight:'900'},rtl:{textAlign:'right',writingDirection:'rtl'},rtlHelp:{marginTop:16,color:colors.orange,fontSize:11,lineHeight:17,fontWeight:'700'}});
