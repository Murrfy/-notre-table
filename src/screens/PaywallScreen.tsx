import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { AccessState, SUBSCRIPTION_REFERENCE_PRICES_USD, SubscriptionBillingPeriod, trialDaysRemaining } from '../services/subscription';
import { useLocale } from '../context/LocaleContext';
import { runtimeConfig } from '../lib/runtimeConfig';

const featureKeys = [
  ['👨‍👩‍👧‍👦','paywall.featureHousehold','paywall.featureHouseholdDesc'],
  ['🔗','paywall.featureImports','paywall.featureImportsDesc'],
  ['📚','paywall.featureRecipes','paywall.featureRecipesDesc'],
  ['🗓️','paywall.featureHistory','paywall.featureHistoryDesc'],
  ['🛡️','paywall.featurePreferences','paywall.featurePreferencesDesc'],
] as const;

type Billing=SubscriptionBillingPeriod;

export type PaywallStorePackage={
  localizedPrice:string;
  purchase:()=>Promise<void>;
};

export type PaywallStoreOffer={
  monthly?:PaywallStorePackage;
  semiannual?:PaywallStorePackage;
  annual?:PaywallStorePackage;
  restorePurchases:()=>Promise<void>;
};

/**
 * Preview/development may show the business-model reference prices in USD.
 * Production must only render localized prices supplied by the active Store
 * through the real RevenueCat adapter. No FX conversion or fallback price is
 * allowed in a shipped build.
 */
export function PaywallScreen({ access, demo=false, onClose, onStartTrial, storeOffer }:{access:AccessState;demo?:boolean;onClose:()=>void;onStartTrial?:()=>void|Promise<void>;storeOffer?:PaywallStoreOffer}) {
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  const remaining=trialDaysRemaining(access);
  const [billing,setBilling]=useState<Billing>('annual');
  const [busy,setBusy]=useState<'purchase'|'restore'|null>(null);
  const billingInFlight=useRef(false);
  const active=access.plan==='trial'||access.plan==='family';
  const production=runtimeConfig.environment==='production';
  const monthlyReference=useMemo(()=>locale.formatCurrency(SUBSCRIPTION_REFERENCE_PRICES_USD.monthly,'USD'),[locale.languageTag]);
  const semiannualReference=useMemo(()=>locale.formatCurrency(SUBSCRIPTION_REFERENCE_PRICES_USD.semiannual,'USD'),[locale.languageTag]);
  const annualReference=useMemo(()=>locale.formatCurrency(SUBSCRIPTION_REFERENCE_PRICES_USD.annual,'USD'),[locale.languageTag]);
  const semiannualEquivalent=useMemo(()=>locale.formatCurrency(SUBSCRIPTION_REFERENCE_PRICES_USD.semiannual/6,'USD'),[locale.languageTag]);
  const annualEquivalent=useMemo(()=>locale.formatCurrency(SUBSCRIPTION_REFERENCE_PRICES_USD.annual/12,'USD'),[locale.languageTag]);
  const monthlyPrice=production?storeOffer?.monthly?.localizedPrice:monthlyReference;
  const semiannualPrice=production?storeOffer?.semiannual?.localizedPrice:semiannualReference;
  const annualPrice=production?storeOffer?.annual?.localizedPrice:annualReference;
  const packageByBilling:Record<Billing,PaywallStorePackage|undefined>={monthly:storeOffer?.monthly,semiannual:storeOffer?.semiannual,annual:storeOffer?.annual};
  const selectedPackage=packageByBilling[billing];
  const storeReady=!production||Boolean(storeOffer?.monthly&&storeOffer?.semiannual&&storeOffer?.annual);
  const cta=production?locale.t('paywall.subscribe'):locale.t(access.plan==='free'?'paywall.tryTrial':access.plan==='trial'?'paywall.trialCta':'paywall.activeCta');
  const trialKey=billing==='annual'?'paywall.afterTrialAnnual':billing==='semiannual'?'paywall.afterTrialSemiannual':'paywall.afterTrialMonthly';
  const trialPrice=billing==='annual'?annualReference:billing==='semiannual'?semiannualReference:monthlyReference;
  const afterTrial=!production&&access.plan==='free'?locale.t(trialKey,{price:trialPrice}):null;

  const purchase=async()=>{
    if(active||busy||billingInFlight.current) return;
    if(production){
      if(!selectedPackage) return;
      billingInFlight.current=true;setBusy('purchase');
      try{await selectedPackage.purchase();}finally{billingInFlight.current=false;setBusy(null);}
      return;
    }
    if(onStartTrial){
      billingInFlight.current=true;setBusy('purchase');
      try{await onStartTrial();}finally{billingInFlight.current=false;setBusy(null);}
    }
  };
  const restore=async()=>{
    if(!production||!storeOffer||busy||billingInFlight.current) return;
    billingInFlight.current=true;setBusy('restore');
    try{await storeOffer.restorePurchases();}finally{billingInFlight.current=false;setBusy(null);}
  };

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.top}><Pressable accessibilityRole="button" onPress={onClose} hitSlop={14}><Text style={styles.close}>{locale.t('common.close')}</Text></Pressable></View>
    <Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('paywall.kicker')}</Text>
    <Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('paywall.title')}</Text>
    <Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('paywall.subtitle')}</Text>

    {access.plan==='trial'&&remaining>0?<View style={styles.trialBanner}><Text style={[styles.trialTitle,rtl&&styles.rtl]}>{locale.t('paywall.trialActive')}</Text><Text style={[styles.trialText,rtl&&styles.rtl]}>{locale.t('paywall.daysRemaining',{count:remaining})}</Text></View>:null}

    <View style={styles.compare}>
      <View style={styles.compareHead}><Text style={styles.compareTitle}>{locale.t('paywall.free')}</Text><Text style={styles.comparePrice}>{locale.formatCurrency(0,'USD')}</Text></View>
      {(['paywall.free1','paywall.free2','paywall.free3','paywall.free4'] as const).map(key=><Text key={key} style={[styles.line,rtl&&styles.rtl]}>• {locale.t(key)}</Text>)}
    </View>

    <View style={[styles.compare,styles.familyCard]}>
      <View style={styles.compareHead}><Text style={styles.familyTitle}>{locale.t('paywall.family')}</Text><Text style={styles.best}>{locale.t('paywall.recommended')}</Text></View>
      {!production?<Text style={[styles.reference,rtl&&styles.rtl]}>{locale.t('paywall.referencePrice')}</Text>:null}
      <View style={styles.billingRow}>
        <Pressable accessibilityRole="button" disabled={production&&!monthlyPrice} accessibilityState={{disabled:production&&!monthlyPrice,selected:billing==='monthly'}} onPress={()=>setBilling('monthly')} style={[styles.billing,billing==='monthly'&&styles.billingActive,production&&!monthlyPrice&&styles.billingDisabled]}><Text style={[styles.billingTitle,billing==='monthly'&&styles.billingTitleActive]}>{locale.t('paywall.monthly')}</Text><Text style={[styles.billingPrice,billing==='monthly'&&styles.billingPriceActive]}>{monthlyPrice??'—'}</Text>{!production?<Text style={[styles.billingMeta,billing==='monthly'&&styles.billingMetaActive]}>{locale.t('paywall.perMonth')}</Text>:null}</Pressable>
        <Pressable accessibilityRole="button" disabled={production&&!semiannualPrice} accessibilityState={{disabled:production&&!semiannualPrice,selected:billing==='semiannual'}} onPress={()=>setBilling('semiannual')} style={[styles.billing,billing==='semiannual'&&styles.billingActive,production&&!semiannualPrice&&styles.billingDisabled]}><Text style={[styles.billingTitle,billing==='semiannual'&&styles.billingTitleActive]}>{locale.t('paywall.semiannual')}</Text><Text style={[styles.billingPrice,billing==='semiannual'&&styles.billingPriceActive]}>{semiannualPrice??'—'}</Text>{!production?<Text style={[styles.billingMeta,billing==='semiannual'&&styles.billingMetaActive]}>≈ {semiannualEquivalent}/{locale.t('paywall.perMonth')} · -17 %</Text>:null}</Pressable>
        <Pressable accessibilityRole="button" disabled={production&&!annualPrice} accessibilityState={{disabled:production&&!annualPrice,selected:billing==='annual'}} onPress={()=>setBilling('annual')} style={[styles.billing,billing==='annual'&&styles.billingActive,production&&!annualPrice&&styles.billingDisabled]}><Text style={[styles.billingTitle,billing==='annual'&&styles.billingTitleActive]}>{locale.t('paywall.annual')}</Text><Text style={[styles.billingPrice,billing==='annual'&&styles.billingPriceActive]}>{annualPrice??'—'}</Text>{!production?<Text style={[styles.billingMeta,billing==='annual'&&styles.billingMetaActive]}>≈ {annualEquivalent}/{locale.t('paywall.perMonth')} · -28 %</Text>:null}</Pressable>
      </View>
      {production&&!storeReady?<Text style={[styles.storeUnavailable,rtl&&styles.rtl]}>{locale.t('paywall.storeUnavailable')}</Text>:null}
      {featureKeys.map(([icon,titleKey,descKey])=><View key={titleKey} style={styles.feature}><Text style={styles.icon}>{icon}</Text><View style={{flex:1}}><Text style={[styles.featureTitle,rtl&&styles.rtl]}>{locale.t(titleKey)}</Text><Text style={[styles.featureText,rtl&&styles.rtl]}>{locale.t(descKey)}</Text></View></View>)}
    </View>

    <Pressable accessibilityRole="button" onPress={purchase} disabled={busy!==null||active||(production?!selectedPackage:!onStartTrial)} accessibilityState={{disabled:busy!==null||active||(production?!selectedPackage:!onStartTrial),busy:busy==='purchase'}} style={[styles.cta,(busy!==null||active||(production?!selectedPackage:!onStartTrial))&&styles.ctaDisabled]}>{busy==='purchase'?<ActivityIndicator color={colors.onAccent}/>:<Text style={styles.ctaText}>{cta}</Text>}</Pressable>
    {afterTrial?<Text style={[styles.afterTrial,rtl&&styles.rtl]}>{afterTrial}</Text>:null}
    {!production?<Text style={[styles.note,rtl&&styles.rtl]}>{locale.t(demo?'paywall.demoNote':'paywall.previewNote')}</Text>:null}
    {production?<Pressable accessibilityRole="button" disabled={!storeOffer||busy!==null} accessibilityState={{disabled:!storeOffer||busy!==null,busy:busy==='restore'}} onPress={restore}><Text style={[styles.restore,(!storeOffer||busy!==null)&&styles.restoreDisabled,rtl&&styles.rtl]}>{busy==='restore'?locale.t('paywall.restoring'):locale.t('paywall.restore')}</Text></Pressable>:<Text style={[styles.restore,rtl&&styles.rtl]}>{locale.t('paywall.restorePreview')}</Text>}
  </ScrollView>;
}

const styles=StyleSheet.create({content:{padding:22,paddingTop:58,paddingBottom:42,backgroundColor:colors.cream,minHeight:'100%'},top:{alignItems:'flex-end'},close:{color:colors.sageDark,fontWeight:'800'},kicker:{marginTop:24,color:colors.sageDark,fontSize:11,fontWeight:'900',letterSpacing:1.6},title:{color:colors.ink,fontSize:34,lineHeight:39,fontWeight:'900',marginTop:8},subtitle:{color:colors.muted,fontSize:15,lineHeight:22,marginTop:10},trialBanner:{backgroundColor:colors.sageSoft,padding:14,borderRadius:radius.md,marginTop:18},trialTitle:{color:colors.sageDark,fontWeight:'900'},trialText:{color:colors.muted,fontSize:12,marginTop:3},compare:{marginTop:18,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:17},familyCard:{borderColor:colors.sageBorder,backgroundColor:colors.sageCard},compareHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},compareTitle:{color:colors.ink,fontSize:20,fontWeight:'900'},comparePrice:{color:colors.muted,fontSize:16,fontWeight:'800'},familyTitle:{color:colors.sageDark,fontSize:21,fontWeight:'900'},best:{fontSize:9,fontWeight:'900',letterSpacing:.7,color:colors.sageDark,backgroundColor:colors.sageBadge,paddingHorizontal:9,paddingVertical:6,borderRadius:999},reference:{color:colors.muted,fontSize:9,marginTop:10},line:{color:colors.ink,fontSize:13,lineHeight:25},billingRow:{flexDirection:'row',gap:7,marginTop:10,marginBottom:11},billing:{flex:1,minWidth:0,borderWidth:1,borderColor:colors.border,borderRadius:14,paddingHorizontal:8,paddingVertical:11,backgroundColor:colors.paper},billingActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},billingDisabled:{opacity:.5},billingTitle:{color:colors.muted,fontWeight:'800',fontSize:10},billingTitleActive:{color:colors.onAccentMuted},billingPrice:{color:colors.ink,fontWeight:'900',fontSize:16,marginTop:3},billingPriceActive:{color:colors.onAccent},billingMeta:{color:colors.muted,fontSize:8,lineHeight:11,marginTop:2},billingMetaActive:{color:colors.onAccentMuted},storeUnavailable:{color:colors.warningText,fontSize:10,lineHeight:15,fontWeight:'800',marginBottom:10},feature:{flexDirection:'row',gap:11,paddingVertical:10,borderTopWidth:1,borderTopColor:colors.sageBorder},icon:{fontSize:21},featureTitle:{color:colors.ink,fontSize:14,fontWeight:'900'},featureText:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:2},cta:{backgroundColor:colors.sageDark,minHeight:56,borderRadius:16,alignItems:'center',justifyContent:'center',marginTop:20},ctaDisabled:{opacity:.55},ctaText:{color:colors.onAccent,fontSize:15,fontWeight:'900'},afterTrial:{color:colors.ink,fontSize:10,lineHeight:15,textAlign:'center',marginTop:9},note:{color:colors.muted,fontSize:10,lineHeight:15,textAlign:'center',marginTop:10},restore:{color:colors.sageDark,fontSize:11,fontWeight:'800',textAlign:'center',marginTop:20},restoreDisabled:{opacity:.45},rtl:{textAlign:'right',writingDirection:'rtl'}});
