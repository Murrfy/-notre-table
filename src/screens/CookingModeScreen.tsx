import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, radius } from '../theme';
import { Recipe } from '../types';
import { useLocale } from '../context/LocaleContext';
import { convertQuantity } from '../lib/units';
import { normalizeUnit } from '../domain/catalog';

export function CookingModeScreen({recipe,onClose}:{recipe:Recipe;onClose:()=>void}){
  useKeepAwake('notre-table-cooking');
  const locale=useLocale(); const rtl=locale.textDirection==='rtl';
  const steps=useMemo(()=>recipe.steps?.filter(Boolean)??[],[recipe.steps]);
  const [index,setIndex]=useState(0);
  const [ingredientsOpen,setIngredientsOpen]=useState(false);
  const current=steps[index]??locale.t('cooking.noStep');
  const progress=steps.length?Math.min(100,((index+1)/steps.length)*100):0;
  const quantityLabel=(quantity:number|null|undefined,unit:string|null|undefined)=>{if(quantity==null)return'';const converted=convertQuantity(quantity,unit,locale.measurementSystem);const normalized=normalizeUnit(converted.unit);const unitLabel=normalized&&['piece','pack','ball','can','box','g','kg','ml','l','tsp','tbsp','cup','oz','lb'].includes(String(normalized))?locale.t(`unit.${normalized}${normalized==='piece'&&converted.quantity!==1?'_plural':''}` as any):String(normalized??'');return `${locale.formatNumber(converted.quantity??quantity)} ${unitLabel}`.trim();};
  return <View style={styles.screen}>
    <View style={styles.header}><View style={{flex:1}}><Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('cooking.kicker')}</Text><Text numberOfLines={2} style={[styles.title,rtl&&styles.rtl]}>{recipe.title}</Text></View><Pressable accessibilityRole="button" onPress={onClose} hitSlop={14}><Text style={styles.close}>{locale.t('common.close')}</Text></Pressable></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${progress}%`}]} /></View>
    <View style={styles.metaRow}><Text style={styles.meta}>{steps.length?locale.t('cooking.stepProgress',{current:index+1,total:steps.length}):locale.t('cooking.preparation')}</Text><Text style={styles.meta}>{locale.t('cooking.portions',{count:locale.formatNumber(recipe.portions)})}</Text></View>

    <ScrollView contentContainerStyle={styles.stepArea} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepText,rtl&&styles.rtl]}>{current}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:ingredientsOpen}} onPress={()=>setIngredientsOpen(v=>!v)} style={styles.ingredientsToggle}><Text style={styles.ingredientsToggleText}>{locale.t(ingredientsOpen?'cooking.hideIngredients':'cooking.showIngredients')}</Text></Pressable>
      {ingredientsOpen?<View style={styles.ingredientsCard}><Text style={[styles.ingredientsTitle,rtl&&styles.rtl]}>{locale.t('cooking.ingredients')}</Text>{recipe.ingredients?.length?recipe.ingredients.map((x,i)=><View key={`${x.name}-${i}`} style={styles.ingredientRow}><Text style={styles.bullet}>•</Text><Text style={[styles.ingredientText,rtl&&styles.rtl]}>{x.name}{x.quantity!=null?` — ${quantityLabel(x.quantity,x.unit)}`:''}</Text></View>):<Text style={[styles.empty,rtl&&styles.rtl]}>{locale.t('cooking.noIngredients')}</Text>}</View>:null}
    </ScrollView>

    <View style={styles.footer}>
      <Pressable accessibilityRole="button" disabled={index===0} accessibilityState={{disabled:index===0}} onPress={()=>setIndex(i=>Math.max(0,i-1))} style={[styles.secondary,index===0&&styles.disabled]}><Text style={styles.secondaryText}>‹ {locale.t('cooking.previous')}</Text></Pressable>
      {steps.length&&index<steps.length-1?<Pressable accessibilityRole="button" onPress={()=>setIndex(i=>Math.min(steps.length-1,i+1))} style={styles.primary}><Text style={styles.primaryText}>{locale.t('cooking.next')} ›</Text></Pressable>:<Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}><Text style={styles.primaryText}>{locale.t('cooking.finish')} ✓</Text></Pressable>}
    </View>
    <Text style={[styles.keepAwake,rtl&&styles.rtl]}>{locale.t('cooking.keepAwake')}</Text>
  </View>;
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.cream,paddingHorizontal:22,paddingTop:58,paddingBottom:24},header:{flexDirection:'row',gap:14,alignItems:'flex-start'},kicker:{color:colors.orange,fontSize:10,fontWeight:'900',letterSpacing:1.4},title:{color:colors.ink,fontSize:26,lineHeight:31,fontWeight:'900',marginTop:5},close:{color:colors.sageDark,fontWeight:'900',paddingTop:5},progressTrack:{height:7,borderRadius:999,backgroundColor:colors.track,overflow:'hidden',marginTop:22},progressFill:{height:'100%',backgroundColor:colors.sageDark,borderRadius:999},metaRow:{flexDirection:'row',justifyContent:'space-between',marginTop:9},meta:{color:colors.muted,fontSize:11,fontWeight:'700'},stepArea:{flexGrow:1,justifyContent:'center',paddingVertical:28},stepText:{color:colors.ink,fontSize:30,lineHeight:42,fontWeight:'800'},ingredientsToggle:{alignSelf:'flex-start',marginTop:28,backgroundColor:colors.sageSoft,paddingHorizontal:13,paddingVertical:10,borderRadius:999},ingredientsToggleText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},ingredientsCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:16,marginTop:13},ingredientsTitle:{color:colors.muted,fontSize:10,fontWeight:'900',letterSpacing:1.1,marginBottom:7},ingredientRow:{flexDirection:'row',gap:8,paddingVertical:5},bullet:{color:colors.orange,fontWeight:'900'},ingredientText:{color:colors.ink,fontSize:13,flex:1},empty:{color:colors.muted,fontSize:12},footer:{flexDirection:'row',gap:10},secondary:{flex:1,minHeight:54,borderWidth:1,borderColor:colors.border,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.paper},disabled:{opacity:.35},secondaryText:{color:colors.sageDark,fontWeight:'900'},primary:{flex:1.35,minHeight:54,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.sageDark},primaryText:{color:colors.onAccent,fontWeight:'900'},keepAwake:{color:colors.muted,fontSize:9,textAlign:'center',marginTop:9},rtl:{textAlign:'right',writingDirection:'rtl'}});
