import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Alert,Pressable,ScrollView,Share,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocale} from '../context/LocaleContext';
import type {TranslationKey} from '../i18n';
import type {MealType} from '../types';
import {colors,radius} from '../theme';
import {
  createLightMember,fetchLightMealQuestion,fetchLightMealSummary,fetchLightMembers,issueLightResponseToken,
  lightResponseLink,LightDesire,LightMealQuestion,LightMealSummary,LightMember,saveLightMealQuestion,
  subscribeLightMealResponses,updateLightMember,
} from '../services/lightParticipation';

const desires:Array<{key:LightDesire;label:TranslationKey}>=[
  {key:'home',label:'light.choice.home'},
  {key:'pizza',label:'light.choice.pizza'},
  {key:'pasta',label:'light.choice.pasta'},
  {key:'sushi',label:'light.choice.sushi'},
  {key:'chinese',label:'light.choice.chinese'},
  {key:'surprise',label:'light.choice.surprise'},
];
const emptySummary:LightMealSummary={total:0,presence:{yes:0,no:0,maybe:0,take_charge:0},desires:{home:0,pizza:0,pasta:0,sushi:0,chinese:0,surprise:0},take_charge_name:null};

function expiryForMealDate(mealDate:string){
  const end=new Date(`${mealDate}T23:59:59.999`);
  if(Number.isNaN(end.getTime())||end.getTime()<=Date.now())return new Date(Date.now()+60*60*1000).toISOString();
  return end.toISOString();
}

export function LightParticipationScreen({householdId,householdName,mealDate,mealType,demo=false,onClose,onFamilyRequired}:{householdId:string;householdName:string;mealDate:string;mealType:MealType;demo?:boolean;onClose:()=>void;onFamilyRequired?:()=>void}){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  const [members,setMembers]=useState<LightMember[]>(demo?[{id:'demo-light-1',household_id:householdId,display_name:'Lina',phone_number:'+33 6 00 00 00 00',active:true}]:[]);
  const [question,setQuestion]=useState<LightMealQuestion|null>(null);
  const [summary,setSummary]=useState<LightMealSummary>(emptySummary);
  const [selected,setSelected]=useState<LightDesire[]>([]);
  const [dirty,setDirty]=useState(false);
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [editingId,setEditingId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const actionInFlight=useRef(false);
  const [message,setMessage]=useState('');
  const dateLabel=useMemo(()=>locale.formatDate(new Date(`${mealDate}T12:00:00`),{weekday:'long',day:'numeric',month:'long'}),[locale,mealDate]);
  const mealLabel=locale.t(`meal.${mealType}` as TranslationKey);

  const refreshSummary=useCallback(async(qid?:string)=>{
    const id=qid??question?.id;if(!id)return;
    if(demo){setSummary(prev=>prev);return;}
    try{setSummary(await fetchLightMealSummary(id));}catch{}
  },[demo,question?.id]);

  const load=useCallback(async()=>{
    if(demo)return;
    try{
      const [nextMembers,nextQuestion]=await Promise.all([fetchLightMembers(householdId),fetchLightMealQuestion(householdId,mealDate,mealType)]);
      setMembers(nextMembers);
      setQuestion(nextQuestion);
      setSelected(nextQuestion?.desire_options??[]);
      setDirty(Boolean(nextQuestion&&new Date(nextQuestion.expires_at).getTime()<=Date.now()));
      setMessage('');
      if(nextQuestion)setSummary(await fetchLightMealSummary(nextQuestion.id));else setSummary(emptySummary);
    }catch(e:any){
      if(String(e?.message??'').includes('FAMILY_PLAN_REQUIRED'))onFamilyRequired?.();
      else setMessage(locale.t('light.loadError'));
    }
  },[demo,householdId,mealDate,mealType,locale,onFamilyRequired]);

  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(demo||!question?.id)return;
    return subscribeLightMealResponses(question.id,()=>{void refreshSummary(question.id);});
  },[demo,question?.id,refreshSummary]);

  const resetForm=()=>{setName('');setPhone('');setEditingId(null);};
  const saveMember=async()=>{
    const cleanName=name.trim(),cleanPhone=phone.trim();
    if(!cleanName||cleanPhone.length<6||actionInFlight.current)return;
    actionInFlight.current=true;setBusy(true);setMessage('');
    try{
      if(demo){
        if(editingId)setMembers(prev=>prev.map(m=>m.id===editingId?{...m,display_name:cleanName,phone_number:cleanPhone}:m));
        else setMembers(prev=>[...prev,{id:`demo-light-${Date.now()}`,household_id:householdId,display_name:cleanName,phone_number:cleanPhone,active:true}]);
      }else if(editingId){
        const current=members.find(m=>m.id===editingId);await updateLightMember(editingId,cleanName,cleanPhone,current?.active!==false);await load();
      }else{await createLightMember(householdId,cleanName,cleanPhone);await load();}
      resetForm();
    }catch(e:any){if(String(e?.message??'').includes('FAMILY_PLAN_REQUIRED'))onFamilyRequired?.();else setMessage(locale.t('light.memberSaveError'));}
    finally{actionInFlight.current=false;setBusy(false);}
  };
  const editMember=(member:LightMember)=>{setEditingId(member.id);setName(member.display_name);setPhone(member.phone_number);};
  const toggleActive=async(member:LightMember)=>{
    if(actionInFlight.current)return;actionInFlight.current=true;setBusy(true);setMessage('');
    try{
      if(demo)setMembers(prev=>prev.map(m=>m.id===member.id?{...m,active:!m.active}:m));
      else{await updateLightMember(member.id,member.display_name,member.phone_number,!member.active);await load();}
    }catch(e:any){if(String(e?.message??'').includes('FAMILY_PLAN_REQUIRED'))onFamilyRequired?.();else setMessage(locale.t('light.memberSaveError'));}
    finally{actionInFlight.current=false;setBusy(false);}
  };
  const toggleDesire=(key:LightDesire)=>{setSelected(prev=>prev.includes(key)?prev.filter(x=>x!==key):[...prev,key]);setDirty(true);};

  const commitQuestion=async()=>{
    if(actionInFlight.current)return;actionInFlight.current=true;setBusy(true);setMessage('');
    try{
      if(demo){
        const next:LightMealQuestion={id:question?.id??'demo-light-question',household_id:householdId,meal_date:mealDate,meal_type:mealType,desire_options:selected,expires_at:expiryForMealDate(mealDate)};
        setQuestion(next);setSummary(emptySummary);setDirty(false);
      }else{
        const id=await saveLightMealQuestion(householdId,mealDate,mealType,selected,expiryForMealDate(mealDate));
        const next=await fetchLightMealQuestion(householdId,mealDate,mealType);
        setQuestion(next??{id,household_id:householdId,meal_date:mealDate,meal_type:mealType,desire_options:selected,expires_at:expiryForMealDate(mealDate)});
        setSummary(emptySummary);setDirty(false);
      }
    }catch(e:any){if(String(e?.message??'').includes('FAMILY_PLAN_REQUIRED'))onFamilyRequired?.();else setMessage(locale.t('light.questionSaveError'));}
    finally{actionInFlight.current=false;setBusy(false);}
  };
  const prepareQuestion=()=>{
    if(question&&summary.total>0&&dirty){
      Alert.alert(locale.t('light.resetTitle'),locale.t('light.resetWarning'),[
        {text:locale.t('common.cancel'),style:'cancel'},
        {text:locale.t('light.resetConfirm'),style:'destructive',onPress:()=>{void commitQuestion();}},
      ]);return;
    }
    void commitQuestion();
  };

  const shareFor=async(member:LightMember)=>{
    if(!question||dirty||!member.active||actionInFlight.current)return;
    actionInFlight.current=true;setBusy(true);setMessage('');
    try{
      if(demo){setMessage(locale.t('light.demoShare'));return;}
      const token=await issueLightResponseToken(question.id,member.id);
      const link=lightResponseLink(token);
      const text=locale.t('light.shareMessage',{name:member.display_name,meal:mealLabel,date:dateLabel,link});
      await Share.share({message:text});
    }catch(e:any){if(String(e?.message??'').includes('FAMILY_PLAN_REQUIRED'))onFamilyRequired?.();else setMessage(locale.t('light.shareError'));}
    finally{actionInFlight.current=false;setBusy(false);}
  };

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View style={{flex:1}}><Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('light.kicker')}</Text><Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('light.title')}</Text><Text style={[styles.meta,rtl&&styles.rtl]}>{householdName} · {dateLabel} · {mealLabel}</Text></View><Text accessibilityRole="button" onPress={onClose} style={styles.close}>{locale.t('common.close')}</Text></View>
    <Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('light.subtitle')}</Text>

    <Text style={[styles.section,rtl&&styles.rtl]}>{locale.t('light.members')}</Text>
    {members.map(member=><View key={member.id} style={[styles.memberCard,!member.active&&styles.inactiveCard]}><View style={{flex:1}}><View style={styles.memberNameRow}><Text style={[styles.memberName,rtl&&styles.rtl]}>{member.display_name}</Text>{!member.active?<Text style={styles.inactiveBadge}>{locale.t('light.inactive')}</Text>:null}</View><Text style={[styles.phone,rtl&&styles.rtl]}>{member.phone_number}</Text></View><View style={styles.memberActions}><Pressable accessibilityRole="button" onPress={()=>editMember(member)} disabled={busy} accessibilityState={{disabled:busy,busy:busy}} style={styles.smallAction}><Text style={styles.smallActionText}>{locale.t('light.edit')}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{void toggleActive(member)}} disabled={busy} accessibilityState={{disabled:busy,busy:busy}} style={styles.smallAction}><Text style={styles.smallActionText}>{locale.t(member.active?'light.deactivate':'light.activate')}</Text></Pressable>{question&&!dirty&&member.active?<Pressable accessibilityRole="button" onPress={()=>{void shareFor(member)}} disabled={busy} accessibilityState={{disabled:busy,busy:busy}} style={styles.shareAction}><Text style={styles.shareActionText}>{locale.t('light.share')}</Text></Pressable>:null}</View></View>)}
    {!members.length?<Text style={[styles.hint,rtl&&styles.rtl]}>{locale.t('light.noMembers')}</Text>:null}

    <View style={styles.formCard}><Text style={[styles.formTitle,rtl&&styles.rtl]}>{locale.t(editingId?'light.editMember':'light.addMember')}</Text><TextInput accessibilityLabel={locale.t('light.name')} value={name} onChangeText={setName} placeholder={locale.t('light.name')} placeholderTextColor={colors.placeholder} style={[styles.input,rtl&&styles.rtl]}/><TextInput accessibilityLabel={locale.t('light.phone')} value={phone} onChangeText={setPhone} placeholder={locale.t('light.phone')} placeholderTextColor={colors.placeholder} keyboardType="phone-pad" autoComplete="tel" style={[styles.input,rtl&&styles.rtl]}/><Pressable accessibilityRole="button" onPress={()=>{void saveMember()}} disabled={busy||!name.trim()||phone.trim().length<6} accessibilityState={{disabled:busy||!name.trim()||phone.trim().length<6,busy:busy}} style={[styles.primary,(busy||!name.trim()||phone.trim().length<6)&&styles.disabled]}><Text style={styles.primaryText}>{locale.t('light.saveMember')}</Text></Pressable>{editingId?<Pressable accessibilityRole="button" onPress={resetForm} style={styles.cancelEdit}><Text style={styles.cancelEditText}>{locale.t('light.cancelEdit')}</Text></Pressable>:null}</View>

    <Text style={[styles.section,rtl&&styles.rtl]}>{locale.t('light.choices')}</Text>
    <Text style={[styles.hint,rtl&&styles.rtl]}>{locale.t('light.choicesHint')}</Text>
    <View style={styles.chips}>{desires.map(option=>{const active=selected.includes(option.key);return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} key={option.key} onPress={()=>toggleDesire(option.key)} style={[styles.chip,active&&styles.chipActive]}><Text style={[styles.chipText,active&&styles.chipTextActive]}>{locale.t(option.label)}</Text></Pressable>;})}</View>
    {question&&summary.total>0&&dirty?<Text style={[styles.resetWarning,rtl&&styles.rtl]}>{locale.t('light.resetWarning')}</Text>:null}
    <Pressable accessibilityRole="button" onPress={prepareQuestion} disabled={busy} accessibilityState={{disabled:busy,busy:busy}} style={[styles.primary,busy&&styles.disabled]}><Text style={styles.primaryText}>{locale.t(question?'light.updateQuestion':'light.prepare')}</Text></Pressable>
    {question&&!dirty?<Text style={[styles.ready,rtl&&styles.rtl]}>{locale.t('light.ready')}</Text>:null}

    {question&&!dirty?<><Text style={[styles.section,rtl&&styles.rtl]}>{locale.t('light.summary')}</Text>{summary.total?<><Text style={[styles.responseCount,rtl&&styles.rtl]}>{locale.t('light.responses',{count:summary.total})}</Text><View style={styles.stats}><Stat label={locale.t('light.yes')} value={summary.presence.yes}/><Stat label={locale.t('light.no')} value={summary.presence.no}/><Stat label={locale.t('light.maybe')} value={summary.presence.maybe}/><Stat label={locale.t('light.takeCharge')} value={summary.presence.take_charge}/></View>{summary.take_charge_name?<Text style={[styles.takeCharge,rtl&&styles.rtl]}>{locale.t('light.takeChargeBy',{name:summary.take_charge_name})}</Text>:null}<Text style={[styles.subsection,rtl&&styles.rtl]}>{locale.t('light.desires')}</Text><View style={styles.stats}>{desires.filter(d=>selected.includes(d.key)&&summary.desires[d.key]>0).map(d=><Stat key={d.key} label={locale.t(d.label)} value={summary.desires[d.key]}/>)}</View></>:<Text style={[styles.hint,rtl&&styles.rtl]}>{locale.t('light.noResponses')}</Text>}</>:null}
    {message?<Text accessibilityLiveRegion="polite" style={[styles.message,rtl&&styles.rtl]}>{message}</Text>:null}
  </ScrollView>;
}

function Stat({label,value}:{label:string;value:number}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;}

const styles=StyleSheet.create({
  content:{padding:22,paddingTop:58,paddingBottom:56,backgroundColor:colors.cream,minHeight:'100%'},header:{flexDirection:'row',gap:12,alignItems:'flex-start'},kicker:{color:colors.sageDark,fontSize:10,fontWeight:'900',letterSpacing:1.1},title:{color:colors.ink,fontSize:28,lineHeight:34,fontWeight:'900',marginTop:6},meta:{color:colors.muted,fontSize:11,fontWeight:'700',marginTop:7,textTransform:'capitalize'},close:{color:colors.sageDark,fontWeight:'900',paddingTop:6},subtitle:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:14},section:{color:colors.muted,fontSize:11,fontWeight:'900',letterSpacing:1,marginTop:24,marginBottom:9,textTransform:'uppercase'},hint:{color:colors.muted,fontSize:11,lineHeight:17,marginBottom:10},memberCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:13,marginTop:8},inactiveCard:{opacity:.62},memberNameRow:{flexDirection:'row',alignItems:'center',gap:7},memberName:{color:colors.ink,fontSize:14,fontWeight:'900'},phone:{color:colors.muted,fontSize:10,marginTop:3},inactiveBadge:{color:colors.muted,fontSize:8,fontWeight:'900',borderWidth:1,borderColor:colors.border,borderRadius:999,paddingHorizontal:6,paddingVertical:3},memberActions:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:10},smallAction:{minHeight:34,borderWidth:1,borderColor:colors.border,borderRadius:11,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},smallActionText:{color:colors.sageDark,fontSize:9,fontWeight:'900'},shareAction:{minHeight:34,borderRadius:11,paddingHorizontal:11,alignItems:'center',justifyContent:'center',backgroundColor:colors.sageDark},shareActionText:{color:colors.onAccent,fontSize:9,fontWeight:'900'},formCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,marginTop:12},formTitle:{color:colors.ink,fontSize:13,fontWeight:'900',marginBottom:8},input:{backgroundColor:colors.input,borderRadius:13,minHeight:47,paddingHorizontal:12,color:colors.ink,marginTop:7,borderWidth:1,borderColor:colors.border},primary:{backgroundColor:colors.sageDark,minHeight:48,borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:14,marginTop:12},primaryText:{color:colors.onAccent,fontSize:12,fontWeight:'900'},disabled:{opacity:.4},cancelEdit:{minHeight:40,alignItems:'center',justifyContent:'center'},cancelEditText:{color:colors.muted,fontSize:10,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderColor:colors.border,borderRadius:999,paddingHorizontal:12,paddingVertical:9,backgroundColor:colors.paper},chipActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},chipText:{color:colors.ink,fontSize:11,fontWeight:'800'},chipTextActive:{color:colors.onAccent},resetWarning:{color:colors.warningText,fontSize:10,lineHeight:15,backgroundColor:colors.orangeSoft,borderRadius:12,padding:10,marginTop:11},ready:{color:colors.sageDark,fontSize:11,lineHeight:17,fontWeight:'800',backgroundColor:colors.sageSoft,borderRadius:12,padding:11,marginTop:10},responseCount:{color:colors.ink,fontSize:13,fontWeight:'900',marginBottom:9},stats:{flexDirection:'row',flexWrap:'wrap',gap:8},stat:{minWidth:74,flexGrow:1,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:10},statValue:{color:colors.sageDark,fontSize:18,fontWeight:'900'},statLabel:{color:colors.muted,fontSize:9,fontWeight:'800',marginTop:3},takeCharge:{color:colors.sageDark,fontSize:11,fontWeight:'900',lineHeight:17,backgroundColor:colors.sageSoft,borderRadius:12,padding:11,marginTop:10},subsection:{color:colors.muted,fontSize:10,fontWeight:'900',marginTop:15,marginBottom:7},message:{color:colors.error,fontSize:11,fontWeight:'800',lineHeight:17,textAlign:'center',marginTop:14},rtl:{textAlign:'right',writingDirection:'rtl'},
});
