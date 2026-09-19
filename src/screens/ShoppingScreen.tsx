import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Network from 'expo-network';
import { addDays, localIsoDate, startOfWeek } from '../lib/dates';
import { supabase } from '../lib/supabase';
import { addShoppingItem, cacheShopping, deleteCheckedShopping, fetchShopping, pendingShoppingQueueCount, readCachedShopping, toggleShoppingItem } from '../services/shopping';
import { colors, radius } from '../theme';
import { HouseholdMember, ShoppingItem, ShoppingResponsibility } from '../types';
import { aisleOrder, AisleCode, normalizeAisle, normalizeUnit } from '../domain/catalog';
import { convertQuantity } from '../lib/units';
import { useLocale } from '../context/LocaleContext';
import { canonicalIngredientKey, localizedIngredientLabel } from '../domain/ingredients';
import { PantryScreen } from './PantryScreen';
import { fetchHouseholdMembers } from '../services/members';
import { claimShoppingResponsibility, clearShoppingResponsibility, fetchShoppingResponsibility } from '../services/shoppingResponsibility';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState } from '../components/EmptyState';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from '../lib/requestGate';
import { isNetworkReachable, shouldReplayShoppingQueue } from '../lib/offlineQueue';
import { classifyPremiumGateError } from '../lib/premiumGate';
import {emitLiaFeatureFirstUse,emitLiaFeatureHelp} from '../services/liaContextualGuidance';

const demoBase: ShoppingItem[] = [
  { id:'s1', label:'Tomatoes', ingredient_key:'tomato', aisle:'produce', checked:false, quantity:4, unit:'piece' },
  { id:'s2', label:'Zucchini', ingredient_key:'zucchini', aisle:'produce', checked:true, quantity:3, unit:'piece' },
  { id:'s3', label:'Lasagna sheets', ingredient_key:'lasagna_sheets', aisle:'pantry', checked:false, quantity:1, unit:'pack' },
  { id:'s4', label:'Mozzarella', ingredient_key:'mozzarella', aisle:'fresh', checked:false, quantity:2, unit:'ball' },
  { id:'s5', label:'Salmon', ingredient_key:'salmon', aisle:'fresh', checked:false, quantity:600, unit:'g' },
];

export function ShoppingScreen({ householdId, liaOrganizerName='', demo=false, weekStart, onWeekStartChange, onFamilyRequired }:{householdId:string;liaOrganizerName?:string;demo?:boolean;weekStart:Date;onWeekStartChange:(date:Date)=>void;onFamilyRequired?:()=>void|Promise<void>}) {
  const locale=useLocale(); const rtl=locale.textDirection==='rtl'; const weekKey=localIsoDate(weekStart);
  const [items,setItems]=useState<ShoppingItem[]>(demo?demoBase:[]); const [loading,setLoading]=useState(!demo); const [status,setStatus]=useState(locale.t(demo?'shopping.localDemo':'shopping.syncing')); const [label,setLabel]=useState(''); const [addingItem,setAddingItem]=useState(false); const [toggleBusyIds,setToggleBusyIds]=useState<string[]>([]); const toggleBusyRef=useRef<Set<string>>(new Set()); const [exportingPdf,setExportingPdf]=useState(false); const [exportError,setExportError]=useState(''); const [pantryOpen,setPantryOpen]=useState(false);
  const [members,setMembers]=useState<HouseholdMember[]>(demo?[{user_id:'u1',role:'admin',display_name:'You',allergies:[],diets:[],disliked_foods:[]},{user_id:'u2',role:'member',display_name:'Paul',allergies:[],diets:[],disliked_foods:[]}]:[]); const [myUserId,setMyUserId]=useState(demo?'u1':''); const [responsibility,setResponsibility]=useState<ShoppingResponsibility|null>(null); const [responsibilityBusy,setResponsibilityBusy]=useState(false); const [responsibilityError,setResponsibilityError]=useState(''); const [toolsOpen,setToolsOpen]=useState(false); const [checkedExpanded,setCheckedExpanded]=useState(false);

  const loadGate=useRef(createRequestGate()).current;
  const responsibilityGate=useRef(createRequestGate()).current;
  const networkReachableRef=useRef<boolean|null>(null);
  const addInFlight=useRef(false);
  const toolsInFlight=useRef(false);
  useEffect(()=>{
    const timer=setTimeout(()=>{void emitLiaFeatureFirstUse({householdId,organizerName:liaOrganizerName,feature:'shopping'});},4_500);
    return()=>clearTimeout(timer);
  },[householdId,liaOrganizerName]);
  useEffect(()=>{
    if(!label.trim()||addingItem)return;
    const timer=setTimeout(()=>{emitLiaFeatureHelp({householdId,organizerName:liaOrganizerName,feature:'shopping',step:'add_item'});},12_000);
    return()=>clearTimeout(timer);
  },[label,addingItem,householdId,liaOrganizerName]);

  const normalizeItems=(values:ShoppingItem[])=>values.map(item=>({...item,aisle:normalizeAisle((item as any).aisle)}));
  const load=useCallback(async()=>{
    const token=beginRequest(loadGate);
    if(demo){
      const cached=normalizeItems(await readCachedShopping(householdId,weekKey));
      if(!isCurrentRequest(loadGate,token))return;
      if(cached.length){
        setItems(cached);setStatus(locale.t('shopping.localDemo'));
      }else{
        const seeded=demoBase.map((x,i)=>({...x,id:`demo-${weekKey}-${i}`,household_id:householdId,week_start:weekKey}));
        setItems(seeded);await cacheShopping(householdId,weekKey,seeded);
        if(isCurrentRequest(loadGate,token))setStatus(locale.t('shopping.localDemo'));
      }
      if(isCurrentRequest(loadGate,token))setLoading(false);
      return;
    }
    const cached=normalizeItems(await readCachedShopping(householdId,weekKey));
    if(!isCurrentRequest(loadGate,token))return;
    if(cached.length)setItems(cached);
    setLoading(!cached.length);
    try{
      const fresh=normalizeItems(await fetchShopping(householdId,weekKey));
      const pendingCount=await pendingShoppingQueueCount(householdId,weekKey);
      if(!isCurrentRequest(loadGate,token))return;
      setItems(fresh);setStatus(locale.t(pendingCount?'shopping.pending':'shopping.synced'));
    }catch{
      if(isCurrentRequest(loadGate,token))setStatus(locale.t('shopping.offline'));
    }finally{
      if(isCurrentRequest(loadGate,token))setLoading(false);
    }
  },[demo,householdId,weekKey,locale.language,loadGate]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    if(demo||!supabase)return;
    let active=true;
    const observe=(state:Network.NetworkState)=>{
      if(!active)return;
      const replay=shouldReplayShoppingQueue(networkReachableRef.current,state);
      networkReachableRef.current=isNetworkReachable(state);
      if(replay)void load();
    };
    const subscription=Network.addNetworkStateListener(observe);
    void Network.getNetworkStateAsync().then(observe).catch(()=>undefined);
    return()=>{active=false;subscription.remove();networkReachableRef.current=null;};
  },[demo,load,networkReachableRef]);
  useEffect(()=>{const client=supabase;if(demo||!client)return;const channel=client.channel(`shopping-${householdId}-${weekKey}`).on('postgres_changes',{event:'*',schema:'public',table:'shopping_items',filter:`household_id=eq.${householdId}`},()=>{load();}).subscribe();return()=>{void client.removeChannel(channel);};},[demo,householdId,weekKey,load]);

  const loadResponsibility=useCallback(async()=>{
    const token=beginRequest(responsibilityGate);
    setResponsibilityError('');
    try{
      if(demo){
        const owner=await fetchShoppingResponsibility(householdId,weekKey,true);
        if(isCurrentRequest(responsibilityGate,token))setResponsibility(owner);
        return;
      }
      if(!supabase)return;
      const [{data:{user}},householdMembers,owner]=await Promise.all([supabase.auth.getUser(),fetchHouseholdMembers(householdId),fetchShoppingResponsibility(householdId,weekKey,false)]);
      if(!isCurrentRequest(responsibilityGate,token))return;
      setMyUserId(user?.id??''); setMembers(householdMembers); setResponsibility(owner);
    }catch{
      if(isCurrentRequest(responsibilityGate,token))setResponsibilityError(locale.t('shopping.ownerError'));
    }
  },[demo,householdId,weekKey,locale.language,responsibilityGate]);
  useEffect(()=>{loadResponsibility();},[loadResponsibility]);
  useEffect(()=>()=>{invalidateRequests(loadGate);invalidateRequests(responsibilityGate);},[loadGate,responsibilityGate]);
  useEffect(()=>{const client=supabase;if(demo||!client)return;const channel=client.channel(`shopping-owner-${householdId}-${weekKey}`).on('postgres_changes',{event:'*',schema:'public',table:'shopping_responsibilities',filter:`household_id=eq.${householdId}`},()=>{loadResponsibility();}).subscribe();return()=>{void client.removeChannel(channel);};},[demo,householdId,weekKey,loadResponsibility]);

  const handleMutationError=async(error:unknown,fallback:()=>void)=>{if(classifyPremiumGateError(error)==='FAMILY_PLAN_REQUIRED'){await onFamilyRequired?.();return true;}fallback();return false;};
  const remaining=items.filter(i=>!i.checked).length;
  const grouped=useMemo(()=>items.reduce<Partial<Record<AisleCode,ShoppingItem[]>>>((acc,item)=>{const aisle=normalizeAisle(item.aisle);(acc[aisle]??=[]).push({...item,aisle});return acc;},{}),[items]);
  const sections=useMemo(()=>aisleOrder.filter(a=>grouped[a]?.length),[grouped]);
  const activeGrouped=useMemo(()=>items.filter(item=>!item.checked).reduce<Partial<Record<AisleCode,ShoppingItem[]>>>((acc,item)=>{const aisle=normalizeAisle(item.aisle);(acc[aisle]??=[]).push({...item,aisle});return acc;},{}),[items]);
  const activeSections=useMemo(()=>aisleOrder.filter(a=>activeGrouped[a]?.length),[activeGrouped]);
  const checkedItems=useMemo(()=>items.filter(item=>item.checked),[items]);
  const aisleLabel=(aisle:AisleCode)=>locale.t(`aisle.${aisle}` as any);
  const displayLabel=(item:ShoppingItem)=>localizedIngredientLabel(item.ingredient_key??canonicalIngredientKey(item.label),locale.language)??item.label;
  const quantityLabel=(item:ShoppingItem)=>{if(item.quantity==null)return'';const converted=convertQuantity(item.quantity,item.unit,locale.measurementSystem);const unit=normalizeUnit(converted.unit);const unitLabel=unit&&['piece','pack','ball','can','box','g','kg','ml','l','tsp','tbsp','cup','oz','lb'].includes(String(unit))?locale.t(`unit.${unit}${unit==='piece'&&converted.quantity!==1?'_plural':''}` as any):String(unit??'');return `${locale.formatNumber(converted.quantity??item.quantity)} ${unitLabel}`.trim();};

  const setToggleBusy=(id:string,busy:boolean)=>{
    if(busy)toggleBusyRef.current.add(id);else toggleBusyRef.current.delete(id);
    setToggleBusyIds([...toggleBusyRef.current]);
  };
  const toggle=async(item:ShoppingItem)=>{
    if(toggleBusyRef.current.has(item.id))return;
    setToggleBusy(item.id,true);
    try{
      const checked=!item.checked;
      const next=items.map(i=>i.id===item.id?{...i,checked}:i);
      setItems(next);
      await cacheShopping(householdId,weekKey,next);
      if(demo){setStatus(locale.t('shopping.localDemo'));return;}
      const synced=await toggleShoppingItem(householdId,weekKey,item,checked);
      setStatus(locale.t(synced?'shopping.synced':'shopping.pending'));
    }catch(e){await handleMutationError(e,()=>setStatus(locale.t('shopping.offline')));await load();}finally{setToggleBusy(item.id,false);}
  };
  const add=async()=>{
    const cleanLabel=label.trim();
    if(!cleanLabel||addingItem||addInFlight.current)return;
    addInFlight.current=true;setAddingItem(true);
    try{
      if(demo){
        const next=[...items,{id:`demo-${Date.now()}`,household_id:householdId,label:cleanLabel,ingredient_key:canonicalIngredientKey(cleanLabel),aisle:'other' as const,checked:false,week_start:weekKey,source:'manual' as const}];
        setItems(next);await cacheShopping(householdId,weekKey,next);setLabel('');setStatus(locale.t('shopping.localDemo'));return;
      }
      try{await addShoppingItem(householdId,weekKey,cleanLabel);setLabel('');await load();}
      catch(e){await handleMutationError(e,()=>setStatus(locale.t('shopping.addError')));}
    }finally{addInFlight.current=false;setAddingItem(false);}
  };
  const clearChecked=async()=>{if(toolsInFlight.current)return;toolsInFlight.current=true;try{const next=items.filter(x=>!x.checked);setItems(next);await cacheShopping(householdId,weekKey,next);if(demo){setStatus(locale.t('shopping.localDemo'));return;}try{await deleteCheckedShopping(householdId,weekKey);await load();}catch(e){await handleMutationError(e,()=>setStatus(locale.t('shopping.deleteError')));await load();}}finally{toolsInFlight.current=false;}};
  const exportText=async()=>{if(toolsInFlight.current)return;toolsInFlight.current=true;try{const lines=[`${locale.t('brand')} — ${locale.t('shopping.title')}`,`${locale.t('shopping.week')} ${locale.formatDate(weekStart,{dateStyle:'medium'})}`,''];for(const section of sections){lines.push(aisleLabel(section).toUpperCase());for(const item of grouped[section]??[]){const qty=quantityLabel(item);lines.push(`${item.checked?'✓':'☐'} ${displayLabel(item)}${qty?` — ${qty}`:''}`)}lines.push('');}await Share.share({message:lines.join('\n')});}finally{toolsInFlight.current=false;}};
  const escapeHtml=(value:string)=>value.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]??c));
  const exportPdf=async()=>{if(toolsInFlight.current)return;toolsInFlight.current=true;setExportError('');setExportingPdf(true);try{const groups=sections.map(section=>`<section><h2>${escapeHtml(aisleLabel(section))}</h2>${(grouped[section]??[]).map(item=>`<div class="item ${item.checked?'done':''}"><span class="box">${item.checked?'✓':'☐'}</span><span>${escapeHtml(displayLabel(item))}${quantityLabel(item)?` <small>— ${escapeHtml(quantityLabel(item))}</small>`:''}</span></div>`).join('')}</section>`).join('');const dir=rtl?'rtl':'ltr';const html=`<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#292B2A;padding:28px;direction:${dir}}h1{font-size:26px;margin:0}p{color:#737A75;margin:6px 0 24px}h2{font-size:12px;letter-spacing:1.2px;color:#557258;border-bottom:1px solid #E8E1D7;padding-bottom:7px;margin-top:22px}.item{display:flex;gap:10px;padding:9px 0;font-size:15px}.box{width:22px}.done{color:#A7AAA8;text-decoration:line-through}small{color:#737A75}footer{margin-top:32px;color:#A7AAA8;font-size:10px}</style></head><body><h1>${escapeHtml(locale.t('brand'))} — ${escapeHtml(locale.t('shopping.title'))}</h1><p>${escapeHtml(locale.t('shopping.week'))} ${escapeHtml(locale.formatDate(weekStart,{dateStyle:'medium'}))}</p>${groups||`<p>${escapeHtml(locale.t('shopping.pdfEmpty'))}</p>`}<footer>${escapeHtml(locale.t('shopping.generatedBy'))}</footer></body></html>`;const{uri}=await Print.printToFileAsync({html});if(!(await Sharing.isAvailableAsync()))throw new Error(locale.t('shopping.pdfUnavailable'));await Sharing.shareAsync(uri,{mimeType:'application/pdf',UTI:'com.adobe.pdf',dialogTitle:locale.t('shopping.pdfTitle')});}catch(e:any){setExportError(e?.message??locale.t('shopping.pdfError'));}finally{toolsInFlight.current=false;setExportingPdf(false);}};

  const ownerId=responsibility?.assigned_user_id??null;
  const ownerName=members.find(m=>m.user_id===ownerId)?.display_name??locale.t('common.member');
  const iAmOwner=!!myUserId&&ownerId===myUserId;
  const claimOwner=async()=>{if(!myUserId||toolsInFlight.current)return;toolsInFlight.current=true;setResponsibilityBusy(true);setResponsibilityError('');try{setResponsibility(await claimShoppingResponsibility(householdId,weekKey,myUserId,demo));}catch(e){await handleMutationError(e,()=>setResponsibilityError(locale.t('shopping.ownerError')));}finally{toolsInFlight.current=false;setResponsibilityBusy(false);}};
  const releaseOwner=async()=>{if(toolsInFlight.current)return;toolsInFlight.current=true;setResponsibilityBusy(true);setResponsibilityError('');try{await clearShoppingResponsibility(householdId,weekKey,demo);setResponsibility(null);}catch(e){await handleMutationError(e,()=>setResponsibilityError(locale.t('shopping.ownerError')));}finally{toolsInFlight.current=false;setResponsibilityBusy(false);}};

  const remainingKey=remaining===1?'shopping.remaining':'shopping.remaining_plural';
  const renderShoppingRow=(item:ShoppingItem,index:number)=>{const busy=toggleBusyIds.includes(item.id);return <Pressable accessibilityRole="checkbox" key={item.id} disabled={busy} accessibilityState={{disabled:busy,checked:item.checked,busy:busy}} onPress={()=>toggle(item)} style={[styles.row,index>0&&styles.rowBorder,rtl&&styles.rowRtl,busy&&{opacity:.55}]}><View style={[styles.check,item.checked&&styles.checkDone,rtl&&styles.checkRtl]}><Text style={styles.checkMark}>{item.checked?'✓':''}</Text></View><View style={{flex:1}}><Text style={[styles.item,item.checked&&styles.itemDone,rtl&&styles.rtl]}>{displayLabel(item)}</Text>{item.quantity!=null?<Text style={[styles.qty,rtl&&styles.rtl]}>{quantityLabel(item)}</Text>:null}</View></Pressable>};

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader title={locale.t('shopping.title')} subtitle={locale.t(remainingKey,{count:remaining})} right={<View style={styles.sync}><View style={styles.syncDot}/><Text style={styles.syncText}>{status}</Text></View>}/>
    <View style={styles.weekNav}><Pressable accessibilityRole="button" accessibilityLabel={locale.t('planning.previousWeek')} onPress={()=>onWeekStartChange(addDays(weekStart,-7))} style={styles.navBtn}><Text style={styles.navText}>‹</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>onWeekStartChange(startOfWeek(new Date(),locale.firstWeekday))} style={styles.weekCenter}><Text style={styles.weekLabel}>{locale.t('shopping.week')}</Text><Text style={styles.weekValue}>{locale.formatDate(weekStart,{day:'numeric',month:'short'})}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={locale.t('planning.nextWeek')} onPress={()=>onWeekStartChange(addDays(weekStart,7))} style={styles.navBtn}><Text style={styles.navText}>›</Text></Pressable></View>
    <View style={styles.addRow}><TextInput accessibilityLabel={locale.t('shopping.add')} value={label} onChangeText={setLabel} onSubmitEditing={add} returnKeyType="done" editable={!addingItem} placeholder={locale.t('shopping.add')} placeholderTextColor={colors.placeholder} style={[styles.input,rtl&&styles.rtl]}/><Pressable accessibilityRole="button" accessibilityLabel={locale.t('shopping.addAction')} disabled={!label.trim()||addingItem} accessibilityState={{disabled:!label.trim()||addingItem,busy:addingItem}} onPress={add} style={[styles.add,(!label.trim()||addingItem)&&styles.addDisabled]}>{addingItem?<ActivityIndicator size="small" color={colors.onAccent}/>:<Text style={styles.addText}>＋</Text>}</Pressable></View>

    {loading?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={{marginTop:30}}/>:activeSections.map(aisle=><View key={aisle} style={styles.group}><Text style={[styles.section,rtl&&styles.rtl]}>{aisleLabel(aisle).toUpperCase()}</Text><View style={styles.card}>{(activeGrouped[aisle]??[]).map(renderShoppingRow)}</View></View>)}
    {!loading&&!items.length?<EmptyState title={locale.t('shopping.emptyTitle')} description={locale.t('shopping.emptyText')} rtl={rtl}/>:null}
    {!loading&&items.length>0&&remaining===0?<EmptyState title={locale.t('shopping.allDoneTitle')} description={locale.t('shopping.allDoneText')} rtl={rtl}/>:null}

    {!loading&&checkedItems.length?<View style={styles.checkedBlock}>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:checkedExpanded}} onPress={()=>setCheckedExpanded(v=>!v)} style={styles.checkedToggle}>
        <Text style={[styles.checkedTitle,rtl&&styles.rtl]}>{locale.t('shopping.checkedTitle')} · {checkedItems.length}</Text>
        <Text style={styles.checkedArrow}>{checkedExpanded?'⌃':'⌄'}</Text>
      </Pressable>
      {checkedExpanded?<View style={styles.card}>{checkedItems.map(renderShoppingRow)}</View>:null}
    </View>:null}

    <Pressable accessibilityRole="button" accessibilityState={{expanded:toolsOpen}} onPress={()=>setToolsOpen(v=>!v)} style={styles.toolsToggle}>
      <View style={{flex:1}}><Text style={[styles.toolsTitle,rtl&&styles.rtl]}>{locale.t('shopping.tools')}</Text>{ownerId?<Text style={[styles.toolsSummary,rtl&&styles.rtl]}>{iAmOwner?locale.t('shopping.ownerMe'):locale.t('shopping.ownerAssigned',{name:ownerName})}</Text>:null}</View>
      <Text style={styles.toolsArrow}>{toolsOpen?'⌃':'⌄'}</Text>
    </Pressable>
    {toolsOpen?<View style={styles.toolsPanel}>
      <Pressable accessibilityRole="button" onPress={()=>setPantryOpen(true)} style={styles.pantryButton}><View style={{flex:1}}><Text style={[styles.pantryTitle,rtl&&styles.rtl]}>{locale.t('shopping.pantryTitle')}</Text><Text style={[styles.pantryText,rtl&&styles.rtl]}>{locale.t('shopping.pantryText')}</Text></View><Text style={styles.pantryArrow}>›</Text></Pressable>
      <View style={styles.ownerCard}><View style={{flex:1}}><Text style={[styles.ownerTitle,rtl&&styles.rtl]}>{locale.t('shopping.ownerTitle')}</Text><Text style={[styles.ownerText,rtl&&styles.rtl]}>{ownerId?(iAmOwner?locale.t('shopping.ownerMe'):locale.t('shopping.ownerAssigned',{name:ownerName})):locale.t('shopping.ownerNone')}</Text></View>{responsibilityBusy?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} size="small" color={colors.sageDark}/>:iAmOwner?<Pressable accessibilityRole="button" onPress={releaseOwner} style={styles.ownerSecondary}><Text style={styles.ownerSecondaryText}>{locale.t('shopping.ownerRelease')}</Text></Pressable>:<Pressable accessibilityRole="button" disabled={!myUserId} accessibilityState={{disabled:!myUserId}} onPress={claimOwner} style={[styles.ownerPrimary,!myUserId&&{opacity:.4}]}><Text style={styles.ownerPrimaryText}>{locale.t('shopping.ownerClaim')}</Text></Pressable>}</View>
      {responsibilityError?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.ownerError,rtl&&styles.rtl]}>{responsibilityError}</Text>:null}
      <View style={styles.actions}><Pressable accessibilityRole="button" onPress={exportText} style={styles.actionBtn}><Text style={styles.actionText}>↗ {locale.t('shopping.text')}</Text></Pressable><Pressable accessibilityRole="button" onPress={exportPdf} disabled={exportingPdf} accessibilityState={{disabled:exportingPdf,busy:exportingPdf}} style={[styles.actionBtn,exportingPdf&&{opacity:.5}]}>{exportingPdf?<ActivityIndicator size="small" color={colors.sageDark}/>:<Text style={styles.actionText}>PDF</Text>}</Pressable><Pressable accessibilityRole="button" onPress={clearChecked} disabled={!checkedItems.length} accessibilityState={{disabled:!checkedItems.length}} style={[styles.actionBtn,!checkedItems.length&&{opacity:.35}]}><Text style={styles.actionText}>✓ {locale.t('shopping.clear')}</Text></Pressable></View>
      {exportError?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.exportError}>{exportError}</Text>:null}
    </View>:null}
    <Modal visible={pantryOpen} animationType="slide" onRequestClose={()=>setPantryOpen(false)}><PantryScreen householdId={householdId} demo={demo} onClose={()=>setPantryOpen(false)} onChanged={()=>{if(!demo)load();}} onFamilyRequired={onFamilyRequired}/></Modal>
  </ScrollView>;
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:28},sync:{backgroundColor:colors.sageSoft,paddingHorizontal:10,paddingVertical:7,borderRadius:999,maxWidth:165,flexDirection:'row',alignItems:'center',gap:6},syncDot:{width:6,height:6,borderRadius:3,backgroundColor:colors.sage},syncText:{color:colors.sageDark,fontSize:10,fontWeight:'800',flexShrink:1},weekNav:{flexDirection:'row',alignItems:'center',gap:8,marginTop:14},navBtn:{width:44,height:44,borderRadius:14,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},navText:{fontSize:26,color:colors.sageDark,fontWeight:'800'},weekCenter:{flex:1,height:44,borderRadius:14,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},weekLabel:{fontSize:9,color:colors.muted,fontWeight:'800',textTransform:'uppercase'},weekValue:{fontSize:13,color:colors.sageDark,fontWeight:'900',marginTop:1},toolsToggle:{flexDirection:'row',alignItems:'center',gap:10,minHeight:46,marginTop:10,paddingHorizontal:13,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper},toolsTitle:{color:colors.sageDark,fontSize:12,fontWeight:'900'},toolsSummary:{color:colors.muted,fontSize:10,marginTop:2},toolsArrow:{color:colors.iconMuted,fontSize:20,fontWeight:'900'},toolsPanel:{paddingTop:2},pantryButton:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:colors.sageCard,borderWidth:1,borderColor:colors.sageBorder,borderRadius:radius.md,padding:15,marginTop:10},pantryTitle:{color:colors.sageDark,fontSize:14,fontWeight:'900'},pantryText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:3},pantryArrow:{color:colors.sageDark,fontSize:28,fontWeight:'700'},ownerCard:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,marginTop:12},ownerTitle:{color:colors.ink,fontSize:13,fontWeight:'900'},ownerText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:3},ownerPrimary:{minHeight:38,borderRadius:11,backgroundColor:colors.sageDark,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},ownerPrimaryText:{color:colors.onAccent,fontSize:10,fontWeight:'900'},ownerSecondary:{minHeight:38,borderRadius:11,backgroundColor:colors.neutralSoft,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},ownerSecondaryText:{color:colors.sageDark,fontSize:10,fontWeight:'900'},ownerError:{color:colors.error,fontSize:10,fontWeight:'700',marginTop:6},addRow:{flexDirection:'row',gap:8,marginTop:14},input:{flex:1,minHeight:48,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:14,color:colors.ink},add:{width:48,borderRadius:radius.md,backgroundColor:colors.sageDark,alignItems:'center',justifyContent:'center'},addDisabled:{opacity:.35},addText:{color:colors.onAccent,fontSize:23},actions:{flexDirection:'row',gap:8,marginTop:10},actionBtn:{flex:1,minHeight:40,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center'},actionText:{fontSize:11,color:colors.sageDark,fontWeight:'800'},group:{marginTop:20},checkedBlock:{marginTop:18},checkedToggle:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:13,marginBottom:8,borderRadius:13,backgroundColor:colors.neutralSoft},checkedTitle:{color:colors.muted,fontSize:11,fontWeight:'900'},checkedArrow:{color:colors.iconMuted,fontSize:18,fontWeight:'900'},section:{color:colors.muted,fontSize:11,letterSpacing:1.1,fontWeight:'800',marginBottom:8},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,overflow:'hidden'},row:{minHeight:56,flexDirection:'row',alignItems:'center',paddingHorizontal:14},rowRtl:{flexDirection:'row-reverse'},rowBorder:{borderTopWidth:1,borderTopColor:colors.border},check:{width:24,height:24,borderRadius:8,borderWidth:2,borderColor:colors.iconMuted,alignItems:'center',justifyContent:'center',marginRight:12},checkRtl:{marginRight:0,marginLeft:12},checkDone:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},checkMark:{color:colors.onAccent,fontWeight:'900',fontSize:14},item:{color:colors.ink,fontSize:15,fontWeight:'600'},itemDone:{color:colors.placeholder,textDecorationLine:'line-through'},qty:{color:colors.muted,fontSize:11,marginTop:2},empty:{textAlign:'center',color:colors.muted,marginTop:30,lineHeight:20},exportError:{color:colors.error,fontSize:11,fontWeight:'700',marginTop:8},rtl:{textAlign:'right',writingDirection:'rtl'}});
