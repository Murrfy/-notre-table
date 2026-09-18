import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useLocale} from '../context/LocaleContext';
import type {CommanderPlace} from '../domain/commander';
import {colors,radius} from '../theme';

export function CommanderCarousel({title,rows,onOpen,initialIndex=0,requestedIndex,onIndexChange,onInteract,onSponsoredVisible,viewAllLabel,onViewAll}:{title:string;rows:CommanderPlace[];onOpen:(row:CommanderPlace)=>void;initialIndex?:number;requestedIndex?:number;onIndexChange?:(index:number)=>void;onInteract?:()=>void;onSponsoredVisible?:(row:CommanderPlace)=>void;viewAllLabel?:string;onViewAll?:()=>void}){
  const locale=useLocale();const rtl=locale.textDirection==='rtl';const{width}=useWindowDimensions();const cardWidth=Math.max(260,width-48);const ref=useRef<ScrollView>(null);const[index,setIndex]=useState(()=>Math.max(0,Math.min(rows.length-1,initialIndex)));const[interacted,setInteracted]=useState(false);const[reduceMotion,setReduceMotion]=useState(false);
  useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduceMotion(value);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduceMotion);return()=>{active=false;sub.remove();};},[]);
  useEffect(()=>{if(index<rows.length)return;const next=Math.max(0,rows.length-1);setIndex(next);onIndexChange?.(next);},[index,onIndexChange,rows.length]);
  useEffect(()=>{if(typeof requestedIndex!=='number'||rows.length===0)return;const next=Math.max(0,Math.min(rows.length-1,requestedIndex));if(next===index)return;setInteracted(true);setIndex(next);ref.current?.scrollTo({x:cardWidth*next,animated:!reduceMotion});},[cardWidth,index,reduceMotion,requestedIndex,rows.length]);
  useEffect(()=>{if(!interacted)return;const row=rows[index];if(row?.sponsored)onSponsoredVisible?.(row);},[index,interacted,onSponsoredVisible,rows]);
  useEffect(()=>{if(reduceMotion||interacted||rows.length<2)return;const timer=setInterval(()=>{setIndex(current=>{const next=(current+1)%rows.length;ref.current?.scrollTo({x:cardWidth*next,animated:true});onIndexChange?.(next);return next;});},6500);return()=>clearInterval(timer);},[cardWidth,interacted,onIndexChange,reduceMotion,rows.length]);
  if(rows.length<3)return null;
  return <View style={styles.block}>
    <Text style={[styles.title,rtl&&styles.rtl]}>{title}</Text>
    <ScrollView ref={ref} horizontal pagingEnabled contentOffset={{x:cardWidth*index,y:0}} showsHorizontalScrollIndicator={false} snapToInterval={cardWidth} decelerationRate="fast" onTouchStart={()=>{setInteracted(true);onInteract?.();}} onMomentumScrollEnd={event=>{onInteract?.();const next=Math.max(0,Math.min(rows.length-1,Math.round(event.nativeEvent.contentOffset.x/cardWidth)));setIndex(next);onIndexChange?.(next);}} accessibilityLabel={title}>
      {rows.map(row=><Pressable key={row.id} accessibilityRole="button" accessibilityLabel={`${row.name}. ${row.sponsored?locale.t('commander.sponsored')+'. ':''}${row.delivery==='confirmed'?locale.t('commander.deliveryConfirmed'):locale.t('commander.deliveryUnknown')}`} onPress={()=>{onInteract?.();if(row.sponsored)onSponsoredVisible?.(row);onOpen(row);}} style={[styles.card,{width:cardWidth}]}>
        <View style={[styles.head,rtl&&styles.rowRtl]}><Text style={[styles.name,rtl&&styles.rtl]}>{row.name}</Text>{row.sponsored?<Text style={styles.sponsored}>{locale.t('commander.sponsored')}</Text>:null}</View>
        <Text style={[styles.meta,rtl&&styles.rtl]}>{row.categories.join(' · ')}</Text>
        <Text style={[styles.delivery,rtl&&styles.rtl]}>{row.delivery==='confirmed'?locale.t('commander.deliveryConfirmed'):locale.t('commander.deliveryUnknown')}</Text>
        {typeof row.distanceKm==='number'?<Text style={[styles.meta,rtl&&styles.rtl]}>{locale.t('commander.distance',{km:locale.formatNumber(row.distanceKm,{maximumFractionDigits:1})})}</Text>:null}
        {row.sourceAttribution?<Text style={[styles.attribution,rtl&&styles.rtl]}>{row.sourceAttribution}</Text>:null}
        {typeof row.etaMin==='number'?<Text style={[styles.meta,rtl&&styles.rtl]}>{locale.t('commander.eta',{minutes:row.etaMin})}</Text>:null}
        <Text style={[styles.open,rtl&&styles.rtl]}>{locale.t('commander.openDetails')}</Text>
      </Pressable>)}
    </ScrollView>
    <View style={[styles.dots,rtl&&styles.rowRtl]} accessibilityLabel={locale.t('commander.page',{current:index+1,total:rows.length})}>
      {rows.map((_,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={locale.t('commander.goToPage',{page:i+1})} accessibilityState={{selected:i===index}} onPress={()=>{onInteract?.();setInteracted(true);setIndex(i);onIndexChange?.(i);ref.current?.scrollTo({x:cardWidth*i,animated:!reduceMotion});}} style={[styles.dot,i===index&&styles.dotActive]}/>) }
    </View>
    {onViewAll&&viewAllLabel?<Pressable accessibilityRole="button" onPress={()=>{onInteract?.();onViewAll();}} style={styles.viewAll}><Text style={styles.viewAllText}>{viewAllLabel}</Text></Pressable>:null}
  </View>;
}

const styles=StyleSheet.create({block:{marginTop:18},title:{color:colors.ink,fontSize:18,fontWeight:'900',marginBottom:10},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:18,minHeight:190,marginRight:8,justifyContent:'space-between'},head:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},name:{flex:1,color:colors.ink,fontSize:21,fontWeight:'900'},meta:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:7},delivery:{color:colors.sageDark,fontSize:12,fontWeight:'900',marginTop:10},open:{color:colors.orange,fontSize:12,fontWeight:'900',marginTop:16},sponsored:{color:colors.orange,fontSize:10,fontWeight:'900'},attribution:{color:colors.muted,fontSize:10,fontWeight:'700',marginTop:6},dots:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,marginTop:10},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.dot},dotActive:{width:20,backgroundColor:colors.sageDark},viewAll:{alignSelf:'center',minHeight:42,marginTop:8,paddingHorizontal:16,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:colors.neutralSoft},viewAllText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},rtl:{textAlign:'right',writingDirection:'rtl'},rowRtl:{flexDirection:'row-reverse'}});
