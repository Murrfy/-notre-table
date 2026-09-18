import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLocale } from '../context/LocaleContext';
import { canonicalIngredientKey } from '../domain/ingredients';
import { asAppError } from '../lib/appError';
import { localIsoDate } from '../lib/dates';
import { rankRecipesForPantry, type RecipePantryMatch } from '../lib/cookWithPantry';
import { mergePantryVisionItems, scanPantryPhoto, type PantryVisionItem } from '../lib/pantryVision';
import { fetchPantry, readCachedPantry } from '../services/pantry';
import { fetchMeals } from '../services/planning';
import { fetchLightMealQuestion, fetchLightMealSummary } from '../services/lightParticipation';
import { LightParticipationScreen } from './LightParticipationScreen';
import { colors, radius } from '../theme';
import type { PantryItem, Recipe } from '../types';

type SourceMode='choice'|'stock'|'photo';

export function CookWithWhatIHaveScreen({
  householdId,
  householdName,
  recipes,
  demoMode=false,
  autoStartCamera=false,
  onClose,
  onSelectRecipe,
  onFamilyRequired,
}:{
  householdId:string;
  householdName:string;
  recipes:Recipe[];
  demoMode?:boolean;
  autoStartCamera?:boolean;
  onClose:()=>void;
  onSelectRecipe:(recipe:Recipe)=>void;
  onFamilyRequired?:()=>void;
}){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  const textAlign=rtl?'right':'left';
  const [mode,setMode]=useState<SourceMode>('choice');
  const [pantry,setPantry]=useState<PantryItem[]>([]);
  const [detected,setDetected]=useState<PantryVisionItem[]>([]);
  const [photoCount,setPhotoCount]=useState(0);
  const [photoUris,setPhotoUris]=useState<string[]>([]);
  const [manualOpen,setManualOpen]=useState(false);
  const [manualText,setManualText]=useState('');
  const [loadingStock,setLoadingStock]=useState(false);
  const [scanning,setScanning]=useState(false);
  const [error,setError]=useState('');
  const [partySize,setPartySize]=useState<number|null>(null);
  const [partyInput,setPartyInput]=useState('');
  const [partyEntryOpen,setPartyEntryOpen]=useState(false);
  const [familyOpen,setFamilyOpen]=useState(false);
  const [familyPresence,setFamilyPresence]=useState<{yes:number;maybe:number;takeCharge:number}|null>(null);
  const mealDate=useMemo(()=>localIsoDate(new Date()),[]);
  const scanInFlight=useRef(false);
  const autoCameraStarted=useRef(false);
  const visionSessionId=useRef(`pantry-${Date.now()}-${Math.random().toString(36).slice(2,10)}`).current;

  const loadStock=useCallback(async()=>{
    setLoadingStock(true);setError('');
    try{
      const items=demoMode?await readCachedPantry(householdId):await fetchPantry(householdId);
      setPantry(items);
      setMode('stock');
    }catch{
      setError(locale.t('cookWith.stockError'));
    }finally{setLoadingStock(false);}
  },[demoMode,householdId,locale]);

  useEffect(()=>()=>{scanInFlight.current=false;},[]);

  const loadMealContext=useCallback(async()=>{
    if(demoMode)return;
    try{
      const meals=await fetchMeals(householdId,mealDate,mealDate);
      const dinner=meals.find(meal=>meal.meal_type==='dinner');
      const participantCount=(dinner?.participant_user_ids?.length??0)+(dinner?.guests?.length??0);
      const plannedCount=dinner?.servings&&dinner.servings>0?dinner.servings:participantCount>0?participantCount:null;
      if(plannedCount)setPartySize(current=>current??plannedCount);
      const question=await fetchLightMealQuestion(householdId,mealDate,'dinner');
      if(question){
        const summary=await fetchLightMealSummary(question.id);
        setFamilyPresence({yes:summary.presence.yes,maybe:summary.presence.maybe,takeCharge:summary.presence.take_charge});
      }
    }catch{}
  },[demoMode,householdId,mealDate]);

  useEffect(()=>{void loadMealContext();},[loadMealContext]);

  const usableDetected=useMemo(()=>detected.filter(item=>!item.needsConfirmation),[detected]);
  const uncertainDetected=useMemo(()=>detected.filter(item=>item.needsConfirmation),[detected]);

  const transientPantry=useMemo(()=>usableDetected.map((item,index):PantryItem=>({
    id:`vision-${index}-${item.ingredientKey}`,
    household_id:householdId,
    label:item.label,
    ingredient_key:item.ingredientKey||canonicalIngredientKey(item.label),
    aisle:item.aisle,
    // A visible count only drives portions when the vision provider is confident enough.
    quantity:item.quantity!=null&&item.quantityConfidence!=null&&item.quantityConfidence>=.7?item.quantity:null,
    unit:item.quantity!=null&&item.quantityConfidence!=null&&item.quantityConfidence>=.7?item.unit:null,
  })),[usableDetected,householdId]);

  const sourceItems=mode==='photo'?transientPantry:pantry;
  const matches=useMemo(()=>rankRecipesForPantry(recipes,sourceItems,3,partySize),[recipes,sourceItems,partySize]);

  useEffect(()=>{
    if(mode!=='photo'||photoCount<1)return;
    updateLiaPantryVisionSession({items:detected,matches});
  },[mode,photoCount,detected,matches]);

  const displayedDetected=useMemo(()=>usableDetected.slice(0,24),[usableDetected]);
  const hiddenDetectedCount=Math.max(0,usableDetected.length-displayedDetected.length);

  const localizedVisionError=(value:unknown)=>{
    const appError=asAppError(value);
    if(!appError)return locale.t('cookWith.photoError');
    if(appError.code==='pantry.photo.visionNotConfigured')return locale.t('cookWith.photoNotConfigured');
    if(appError.code==='pantry.photo.prepareFailed')return locale.t('cookWith.photoPrepareError');
    if(appError.code==='pantry.photo.noItems')return locale.t('cookWith.photoNoItems');
    if(appError.code==='pantry.photo.visionUnavailable')return locale.t('cookWith.photoUnavailable');
    return locale.t('cookWith.photoError');
  };

  const runPhoto=async(source:'camera'|'library')=>{
    if(scanInFlight.current)return;
    if(photoCount===0)clearLiaPantryVisionSession();
    scanInFlight.current=true;setScanning(true);setError('');
    try{
      let result;
      if(source==='camera'){
        const permission=await ImagePicker.requestCameraPermissionsAsync();
        if(!permission.granted){setError(locale.t('cookWith.cameraDenied'));return;}
        result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.65,base64:true});
      }else{
        result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.65,base64:true});
      }
      if(result.canceled||!result.assets?.[0])return;
      const asset=result.assets[0];
      const next=await scanPantryPhoto({
        base64:asset.base64,
        mimeType:asset.mimeType,
        demoMode,
        displayLanguage:locale.language,
        regionCode:locale.regionCode,
        sessionId:visionSessionId,
        photoIndex:photoCount+1,
      });
      setDetected(current=>mergePantryVisionItems(current,next));
      setPhotoUris(current=>current.includes(asset.uri)?current:[...current,asset.uri]);
      setPhotoCount(count=>count+1);
      setMode('photo');
    }catch(e){setError(localizedVisionError(e));}
    finally{scanInFlight.current=false;setScanning(false);}
  };


  useEffect(()=>{
    if(!autoStartCamera||autoCameraStarted.current)return;
    autoCameraStarted.current=true;
    void runPhoto('camera');
  },[autoStartCamera]);

  const addManualItems=()=>{
    const labels=manualText.split(/[,;\n]+/).map(value=>value.trim()).filter(Boolean).slice(0,20);
    if(!labels.length)return;
    const items:PantryVisionItem[]=labels.map(label=>({
      label,
      ingredientKey:canonicalIngredientKey(label),
      confidence:1,
      aisle:'other',
      recognitionLevel:'ingredient',
      sources:['memory'],
      productCode:null,
      sourceText:label,
      detectedLanguage:locale.language,
      quantity:null,
      unit:null,
      quantityConfidence:null,
      needsConfirmation:false,
    }));
    setDetected(current=>mergePantryVisionItems(current,items));
    setManualText('');
    setManualOpen(false);
    setMode('photo');
  };

  const confirmDetected=(ingredientKey:string)=>setDetected(current=>current.map(item=>item.ingredientKey===ingredientKey?{...item,needsConfirmation:false}:item));
  const removeDetected=(ingredientKey:string)=>setDetected(current=>current.filter(item=>item.ingredientKey!==ingredientKey));

  const openRecipe=(match:RecipePantryMatch)=>onSelectRecipe(match.recipe);
  const confirmPartySize=()=>{
    const next=Math.max(1,Math.min(30,Math.round(Number(partyInput))));
    if(!Number.isFinite(next))return;
    setPartySize(next);setPartyInput(String(next));setPartyEntryOpen(false);
  };
  const closeFamily=()=>{setFamilyOpen(false);void loadMealContext();};
  const missingLabel=(count:number)=>count===0?locale.t('cookWith.nothingMissing'):locale.t(count===1?'cookWith.missingOne':'cookWith.missingMany',{count});
  const statusLabel=(match:RecipePantryMatch)=>{
    if(match.missing.length)return missingLabel(match.missing.length);
    if(match.insufficient.length)return locale.t(match.insufficient.length===1?'cookWith.insufficientOne':'cookWith.insufficientMany',{count:match.insufficient.length});
    if(match.quantityUnknown.length)return locale.t(match.quantityUnknown.length===1?'cookWith.quantityCheckOne':'cookWith.quantityCheckMany',{count:match.quantityUnknown.length});
    return locale.t('cookWith.quantityEnough',{count:partySize??1});
  };

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader
      title={locale.t('cookWith.title')}
      subtitle={locale.t('cookWith.subtitle')}
      right={<Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>{locale.t('common.close')}</Text></Pressable>}
    />

    {mode==='choice'?<>
      <Text style={[styles.question,{textAlign}]}>{locale.t('cookWith.question')}</Text>
      <Pressable accessibilityRole="button" onPress={()=>{void runPhoto('camera')}} disabled={scanning} accessibilityState={{disabled:scanning,busy:scanning}} style={[styles.primaryCard,scanning&&styles.disabled]}>
        <View style={styles.iconBubble}><Text style={styles.icon}>📷</Text></View>
        <View style={{flex:1}}><Text style={[styles.cardTitle,{textAlign}]}>{locale.t('cookWith.photo')}</Text><Text style={[styles.cardText,{textAlign}]}>{locale.t('cookWith.photoHint')}</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>{void loadStock()}} disabled={loadingStock} accessibilityState={{disabled:loadingStock,busy:loadingStock}} style={[styles.card,loadingStock&&styles.disabled]}>
        <View style={styles.iconBubble}><Text style={styles.icon}>🏠</Text></View>
        <View style={{flex:1}}><Text style={[styles.cardTitle,{textAlign}]}>{locale.t('cookWith.stock')}</Text><Text style={[styles.cardText,{textAlign}]}>{locale.t('cookWith.stockHint')}</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>{setManualOpen(true);setMode('photo')}} style={styles.card}>
        <View style={styles.iconBubble}><Text style={styles.icon}>✍️</Text></View>
        <View style={{flex:1}}><Text style={[styles.cardTitle,{textAlign}]}>{locale.t('cookWith.manual')}</Text><Text style={[styles.cardText,{textAlign}]}>{locale.t('cookWith.manualHint')}</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      {scanning||loadingStock?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={{marginTop:18}}/>:null}
    </>:null}

    {mode==='photo'?<>
      <View style={styles.detectedCard}>
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle,{textAlign}]}>{locale.t('cookWith.detected')}</Text><Pressable accessibilityRole="button" onPress={()=>{setDetected([]);setPhotoCount(0);setPhotoUris([]);setManualOpen(false);setManualText('');setMode('choice');setError('')}}><Text style={styles.change}>{locale.t('cookWith.change')}</Text></Pressable></View>
        <Text style={[styles.detectedHint,{textAlign}]}>{locale.t('cookWith.photoBatchCount',{count:photoCount})}</Text>
        {photoUris.length?<View style={styles.photoStrip}>{photoUris.slice(0,5).map((uri,index)=><Image key={`${uri}-${index}`} source={{uri}} style={styles.photoThumb} />)}{photoUris.length>5?<View style={styles.photoMore}><Text style={styles.photoMoreText}>+{photoUris.length-5}</Text></View>:null}</View>:null}
        <Text style={[styles.detectedHint,{textAlign}]}>{locale.t('cookWith.detectedHint')}</Text>
        <View style={styles.chips}>{displayedDetected.map(item=><View key={item.ingredientKey} style={styles.chip}><Text style={styles.chipText}>{item.label}</Text></View>)}{hiddenDetectedCount?<View style={styles.chip}><Text style={styles.chipText}>{locale.t('cookWith.moreDetected',{count:hiddenDetectedCount})}</Text></View>:null}</View>
        {uncertainDetected.length?<View style={styles.confirmBox}>
          <Text style={[styles.confirmTitle,{textAlign}]}>{locale.t('cookWith.checkQuestion')}</Text>
          <Text style={[styles.detectedHint,{textAlign}]}>{locale.t('cookWith.checkHint')}</Text>
          {uncertainDetected.slice(0,4).map(item=><View key={item.ingredientKey} style={styles.confirmRow}>
            <Text style={[styles.confirmLabel,{textAlign}]}>{item.label}</Text>
            <Pressable accessibilityRole="button" onPress={()=>confirmDetected(item.ingredientKey)} style={styles.confirmYes}><Text style={styles.confirmYesText}>{locale.t('cookWith.confirmYes')}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={()=>removeDetected(item.ingredientKey)} style={styles.confirmNo}><Text style={styles.confirmNoText}>{locale.t('cookWith.confirmNo')}</Text></Pressable>
          </View>)}
        </View>:null}
        <Text style={[styles.followupQuestion,{textAlign}]}>{locale.t('cookWith.completeQuestion')}</Text>
        <View style={styles.photoActions}>
          <Pressable accessibilityRole="button" onPress={()=>{void runPhoto('camera')}} disabled={scanning} accessibilityState={{disabled:scanning,busy:scanning}} style={styles.smallButton}><Text style={styles.smallButtonText}>{locale.t('cookWith.addPhoto')}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{expanded:manualOpen}} onPress={()=>setManualOpen(value=>!value)} style={styles.smallButton}><Text style={styles.smallButtonText}>{locale.t('cookWith.addManual')}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>{void runPhoto('library')}} disabled={scanning} accessibilityState={{disabled:scanning,busy:scanning}} style={styles.smallButton}><Text style={styles.smallButtonText}>{locale.t('cookWith.choosePhoto')}</Text></Pressable>
        </View>
        {manualOpen?<View style={styles.manualBox}>
          <Text style={[styles.manualPrompt,{textAlign}]}>{locale.t('cookWith.manualQuestion')}</Text>
          <TextInput accessibilityLabel={locale.t('cookWith.manualPlaceholder')} value={manualText} onChangeText={setManualText} placeholder={locale.t('cookWith.manualPlaceholder')} placeholderTextColor={colors.placeholder} multiline style={[styles.manualInput,{textAlign}]}/>
          <Pressable accessibilityRole="button" onPress={addManualItems} disabled={!manualText.trim()} accessibilityState={{disabled:!manualText.trim()}} style={[styles.manualAdd,!manualText.trim()&&styles.disabled]}><Text style={styles.manualAddText}>{locale.t('cookWith.manualAdd')}</Text></Pressable>
        </View>:null}
      </View>
      <PartyDecision partySize={partySize} familyPresence={familyPresence} partyInput={partyInput} partyEntryOpen={partyEntryOpen} setPartyInput={setPartyInput} setPartyEntryOpen={setPartyEntryOpen} onConfirm={confirmPartySize} onAskFamily={()=>setFamilyOpen(true)} onChange={()=>{setPartySize(null);setPartyInput('');setPartyEntryOpen(false);}} locale={locale} textAlign={textAlign}/>
      {partySize?<Ideas matches={matches} statusLabel={statusLabel} onOpen={openRecipe} locale={locale} textAlign={textAlign}/>:null}
    </>:null}

    {mode==='stock'?<>
      <View style={styles.detectedCard}>
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle,{textAlign}]}>{locale.t('cookWith.stockUsed')}</Text><Pressable accessibilityRole="button" onPress={()=>{setMode('choice');setError('')}}><Text style={styles.change}>{locale.t('cookWith.change')}</Text></Pressable></View>
        <Text style={[styles.detectedHint,{textAlign}]}>{pantry.length?locale.t('cookWith.stockCount',{count:pantry.length}):locale.t('cookWith.stockEmpty')}</Text>
      </View>
      <PartyDecision partySize={partySize} familyPresence={familyPresence} partyInput={partyInput} partyEntryOpen={partyEntryOpen} setPartyInput={setPartyInput} setPartyEntryOpen={setPartyEntryOpen} onConfirm={confirmPartySize} onAskFamily={()=>setFamilyOpen(true)} onChange={()=>{setPartySize(null);setPartyInput('');setPartyEntryOpen(false);}} locale={locale} textAlign={textAlign}/>
      {partySize?<Ideas matches={matches} statusLabel={statusLabel} onOpen={openRecipe} locale={locale} textAlign={textAlign}/>:null}
    </>:null}

    {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,{textAlign}]}>{error}</Text>:null}
    <Modal visible={familyOpen} animationType="slide" onRequestClose={closeFamily}>
      <LightParticipationScreen householdId={householdId} householdName={householdName} mealDate={mealDate} mealType="dinner" demo={demoMode} onClose={closeFamily} onFamilyRequired={()=>{setFamilyOpen(false);onFamilyRequired?.();}}/>
    </Modal>
  </ScrollView>;
}

function PartyDecision({partySize,familyPresence,partyInput,partyEntryOpen,setPartyInput,setPartyEntryOpen,onConfirm,onAskFamily,onChange,locale,textAlign}:{partySize:number|null;familyPresence:{yes:number;maybe:number;takeCharge:number}|null;partyInput:string;partyEntryOpen:boolean;setPartyInput:(value:string)=>void;setPartyEntryOpen:(value:boolean)=>void;onConfirm:()=>void;onAskFamily:()=>void;onChange:()=>void;locale:ReturnType<typeof useLocale>;textAlign:'left'|'right'}){
  if(partySize)return <View style={styles.peopleReady}><View style={{flex:1}}><Text style={[styles.peopleReadyTitle,{textAlign}]}>{locale.t('cookWith.peopleKnown',{count:partySize})}</Text><Text style={[styles.detectedHint,{textAlign}]}>{locale.t('cookWith.peopleKnownHint')}</Text></View><Pressable accessibilityRole="button" onPress={onChange}><Text style={styles.change}>{locale.t('cookWith.peopleChange')}</Text></Pressable></View>;
  return <View style={styles.peopleCard}>
    <Text style={[styles.peopleTitle,{textAlign}]}>{locale.t('cookWith.peopleQuestion')}</Text>
    <Text style={[styles.detectedHint,{textAlign}]}>{familyPresence?locale.t('cookWith.familyReply',{yes:familyPresence.yes+familyPresence.takeCharge,maybe:familyPresence.maybe}):locale.t('cookWith.peopleHint')}</Text>
    <View style={styles.peopleActions}>
      <Pressable accessibilityRole="button" onPress={onAskFamily} style={styles.peoplePrimary}><Text style={styles.peoplePrimaryText}>{locale.t('cookWith.askFamily')}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:partyEntryOpen}} onPress={()=>setPartyEntryOpen(!partyEntryOpen)} style={styles.peopleSecondary}><Text style={styles.peopleSecondaryText}>{locale.t('cookWith.knowCount')}</Text></Pressable>
    </View>
    {partyEntryOpen?<View style={styles.peopleEntry}><TextInput accessibilityLabel={locale.t('cookWith.peopleInput')} value={partyInput} onChangeText={value=>setPartyInput(value.replace(/[^0-9]/g,'').slice(0,2))} keyboardType="number-pad" placeholder={locale.t('cookWith.peopleInput')} placeholderTextColor={colors.placeholder} style={[styles.peopleInput,{textAlign}]}/><Pressable accessibilityRole="button" onPress={onConfirm} disabled={!partyInput||Number(partyInput)<1} accessibilityState={{disabled:!partyInput||Number(partyInput)<1}} style={[styles.peopleContinue,(!partyInput||Number(partyInput)<1)&&styles.disabled]}><Text style={styles.peopleContinueText}>{locale.t('cookWith.continue')}</Text></Pressable></View>:null}
  </View>;
}

function Ideas({matches,statusLabel,onOpen,locale,textAlign}:{matches:RecipePantryMatch[];statusLabel:(match:RecipePantryMatch)=>string;onOpen:(match:RecipePantryMatch)=>void;locale:ReturnType<typeof useLocale>;textAlign:'left'|'right'}){
  return <View style={styles.ideas}>
    <Text style={[styles.ideasTitle,{textAlign}]}>{locale.t('cookWith.ideas')}</Text>
    <Text style={[styles.ideasSubtitle,{textAlign}]}>{locale.t('cookWith.ideasHint')}</Text>
    {matches.length?matches.map(match=><Pressable accessibilityRole="button" key={match.recipe.id} onPress={()=>onOpen(match)} style={styles.ideaCard}>
      <View style={{flex:1}}>
        <Text style={[styles.ideaTitle,{textAlign}]}>{match.recipe.title}</Text>
        <Text style={[styles.ideaMeta,{textAlign}]}>{match.recipe.prep_minutes+match.recipe.cook_minutes} min · {statusLabel(match)}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>):<View style={styles.empty}><Text style={[styles.emptyTitle,{textAlign}]}>{locale.t('cookWith.noIdeasTitle')}</Text><Text style={[styles.emptyText,{textAlign}]}>{locale.t('cookWith.noIdeasText')}</Text></View>}
  </View>;
}

const styles=StyleSheet.create({
  content:{padding:20,paddingBottom:44,backgroundColor:colors.cream,minHeight:'100%'},
  closeButton:{minHeight:44,minWidth:54,alignItems:'center',justifyContent:'center'},closeText:{color:colors.sageDark,fontSize:12,fontWeight:'900'},
  question:{fontSize:16,fontWeight:'900',color:colors.ink,marginTop:18,marginBottom:10},
  primaryCard:{minHeight:92,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:colors.sageCard,borderWidth:1,borderColor:colors.sageBorder,borderRadius:radius.md,padding:15},
  card:{minHeight:92,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:15,marginTop:10},
  disabled:{opacity:.55},iconBubble:{width:48,height:48,borderRadius:18,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},icon:{fontSize:22},cardTitle:{color:colors.ink,fontSize:15,fontWeight:'900'},cardText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:4},arrow:{color:colors.sageDark,fontSize:28,fontWeight:'800'},
  detectedCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:15,marginTop:18},sectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},sectionTitle:{color:colors.ink,fontSize:15,fontWeight:'900',flex:1},change:{color:colors.sageDark,fontSize:11,fontWeight:'900'},detectedHint:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:5},photoStrip:{flexDirection:'row',gap:7,marginTop:10},photoThumb:{width:44,height:44,borderRadius:10,backgroundColor:colors.neutralSoft},photoMore:{width:44,height:44,borderRadius:10,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},photoMoreText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:12},chip:{backgroundColor:colors.sageSoft,borderRadius:999,paddingHorizontal:10,paddingVertical:7},chipText:{color:colors.sageDark,fontSize:11,fontWeight:'800'},followupQuestion:{color:colors.ink,fontSize:12,fontWeight:'900',marginTop:14},photoActions:{flexDirection:'row',gap:8,marginTop:9},smallButton:{flex:1,minHeight:42,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.neutralSoft,alignItems:'center',justifyContent:'center',paddingHorizontal:8},smallButtonText:{color:colors.sageDark,fontSize:10,fontWeight:'900',textAlign:'center'},confirmBox:{marginTop:13,padding:12,borderRadius:12,backgroundColor:colors.orangeSoft},confirmTitle:{color:colors.ink,fontSize:12,fontWeight:'900'},confirmRow:{flexDirection:'row',alignItems:'center',gap:7,marginTop:9},confirmLabel:{flex:1,color:colors.ink,fontSize:11,fontWeight:'800'},confirmYes:{minWidth:46,minHeight:36,borderRadius:10,backgroundColor:colors.sageDark,alignItems:'center',justifyContent:'center'},confirmYesText:{color:colors.onAccent,fontSize:10,fontWeight:'900'},confirmNo:{minWidth:46,minHeight:36,borderRadius:10,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},confirmNoText:{color:colors.warningText,fontSize:10,fontWeight:'900'},manualBox:{marginTop:11,padding:12,borderRadius:12,backgroundColor:colors.neutralSoft},manualPrompt:{color:colors.ink,fontSize:11,fontWeight:'900',marginBottom:8},manualInput:{minHeight:64,borderRadius:11,borderWidth:1,borderColor:colors.border,backgroundColor:colors.input,paddingHorizontal:11,paddingVertical:10,color:colors.ink,fontSize:12},manualAdd:{minHeight:40,borderRadius:11,backgroundColor:colors.sageDark,alignItems:'center',justifyContent:'center',marginTop:8},manualAddText:{color:colors.onAccent,fontSize:11,fontWeight:'900'},
  peopleCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.sageBorder,borderRadius:radius.md,padding:15,marginTop:14},peopleTitle:{color:colors.ink,fontSize:15,fontWeight:'900'},peopleActions:{flexDirection:'row',gap:8,marginTop:12},peoplePrimary:{flex:1,minHeight:44,borderRadius:12,backgroundColor:colors.sageDark,alignItems:'center',justifyContent:'center',paddingHorizontal:9},peoplePrimaryText:{color:colors.onAccent,fontSize:10,fontWeight:'900',textAlign:'center'},peopleSecondary:{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.neutralSoft,alignItems:'center',justifyContent:'center',paddingHorizontal:9},peopleSecondaryText:{color:colors.sageDark,fontSize:10,fontWeight:'900',textAlign:'center'},peopleEntry:{flexDirection:'row',gap:8,marginTop:10},peopleInput:{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.input,paddingHorizontal:12,color:colors.ink,fontSize:16},peopleContinue:{minWidth:102,minHeight:44,borderRadius:12,backgroundColor:colors.sageDark,alignItems:'center',justifyContent:'center',paddingHorizontal:12},peopleContinueText:{color:colors.onAccent,fontSize:10,fontWeight:'900'},peopleReady:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:colors.sageSoft,borderRadius:radius.md,padding:13,marginTop:14},peopleReadyTitle:{color:colors.sageDark,fontSize:13,fontWeight:'900'},
  ideas:{marginTop:20},ideasTitle:{fontSize:18,fontWeight:'900',color:colors.ink},ideasSubtitle:{fontSize:11,lineHeight:16,color:colors.muted,marginTop:4,marginBottom:9},ideaCard:{minHeight:72,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,marginTop:8},ideaTitle:{color:colors.ink,fontSize:14,fontWeight:'900'},ideaMeta:{color:colors.muted,fontSize:11,marginTop:4},empty:{backgroundColor:colors.orangeSoft,borderRadius:radius.md,padding:15,marginTop:8},emptyTitle:{color:colors.ink,fontSize:13,fontWeight:'900'},emptyText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:4},error:{color:colors.error,fontSize:11,fontWeight:'700',marginTop:14},
});
