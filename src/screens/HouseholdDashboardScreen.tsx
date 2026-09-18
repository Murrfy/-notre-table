import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState } from '../components/EmptyState';
import { createInvitation } from '../services/households';
import { getMyPreferences, Preferences, saveMyPreferences } from '../services/preferences';
import { fetchHouseholdMembers } from '../services/members';
import { colors, radius } from '../theme';
import { getMyProfile, removeMyAvatar, updateMyDisplayName, uploadMyAvatar } from '../services/profiles';
import { Household, HouseholdActivity, HouseholdMember } from '../types';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { PaywallScreen } from './PaywallScreen';
import { LanguageSettingsScreen } from './LanguageSettingsScreen';
import { ThemeSettingsScreen } from './ThemeSettingsScreen';
import { PrivacyDataScreen } from './PrivacyDataScreen';
import { useAppTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { AccessState, hasFamilyAccess, trialDaysRemaining } from '../services/subscription';
import * as ImagePicker from 'expo-image-picker';
import { fetchRecentHouseholdActivity } from '../services/activity';
import { supabase } from '../lib/supabase';
import { inviteLinkForCode } from '../lib/inviteLinks';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from '../lib/requestGate';
import { classifyPremiumGateError } from '../lib/premiumGate';

const demoMembers:HouseholdMember[]=[
  {user_id:'u1',role:'admin',display_name:'You',allergies:[],diets:[],disliked_foods:[]},
  {user_id:'u2',role:'member',display_name:'Paul',allergies:['milk'],diets:[],disliked_foods:['zucchini']},
  {user_id:'u3',role:'member',display_name:'Léa',allergies:[],diets:['vegetarian'],disliked_foods:[]},
]

const demoActivity:HouseholdActivity[]=[
  {id:'a1',household_id:'demo-household',actor_user_id:'u2',actor_name:'Paul',event_type:'shopping_checked',details:{label:'Tomatoes'},created_at:new Date(Date.now()-12*60*1000).toISOString()},
  {id:'a2',household_id:'demo-household',actor_user_id:'u3',actor_name:'Léa',event_type:'meal_idea_added',details:{title:'Vegetable curry'},created_at:new Date(Date.now()-55*60*1000).toISOString()},
  {id:'a3',household_id:'demo-household',actor_user_id:'u1',actor_name:'You',event_type:'meal_updated',details:{meal_type:'dinner',meal_date:new Date().toISOString().slice(0,10)},created_at:new Date(Date.now()-2*60*60*1000).toISOString()},
];

export function HouseholdDashboardScreen({ household, demo=false, access, onRefreshAccess, onStartTrial, onSignOut }:{household:Household;demo?:boolean;access:AccessState;onRefreshAccess?:()=>Promise<AccessState>;onStartTrial?:()=>void;onSignOut:()=>void}) {
  const locale=useLocale(); const theme=useAppTheme(); const rtl=locale.textDirection==='rtl';
  const [code,setCode]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [prefs,setPrefs]=useState<Preferences>({allergies:[],diets:[],disliked_foods:[]});
  const [members,setMembers]=useState<HouseholdMember[]>(demo?demoMembers:[]);
  const [prefsOpen,setPrefsOpen]=useState(false);
  const [allergies,setAllergies]=useState('');
  const [diets,setDiets]=useState('');
  const [disliked,setDisliked]=useState('');
  const [displayName,setDisplayName]=useState(demo?'You':'');
  const [myUserId,setMyUserId]=useState(demo?'u1':'');
  const [avatarBusy,setAvatarBusy]=useState(false);
  const [avatarError,setAvatarError]=useState('');
  const [prefsSaving,setPrefsSaving]=useState(false);
  const [activity,setActivity]=useState<HouseholdActivity[]>(demo?demoActivity:[]);
  const [activityLoading,setActivityLoading]=useState(false);
  const [activityExpanded,setActivityExpanded]=useState(false);
  const [settingsExpanded,setSettingsExpanded]=useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [paywallOpen,setPaywallOpen]=useState(false);
  const [languageOpen,setLanguageOpen]=useState(false);
  const [themeOpen,setThemeOpen]=useState(false);
  const [privacyOpen,setPrivacyOpen]=useState(false);
  const familyAccess=hasFamilyAccess(access);
  const trialDays=trialDaysRemaining(access);
  const profileGate=useRef(createRequestGate()).current;
  const activityGate=useRef(createRequestGate()).current;
  const inviteInFlight=useRef(false);
  const avatarInFlight=useRef(false);
  const prefsInFlight=useRef(false);

  useEffect(()=>{
    if(demo)return;
    const token=beginRequest(profileGate);
    Promise.all([getMyPreferences(),fetchHouseholdMembers(household.id),getMyProfile()])
      .then(([p,m,profile])=>{if(isCurrentRequest(profileGate,token)){setPrefs(p);setMembers(m);setDisplayName(profile.display_name);setMyUserId(profile.id);}})
      .catch(()=>{});
    return()=>{invalidateRequests(profileGate);};
  },[demo,household.id,profileGate]);

  useEffect(()=>{
    if(demo||!activityExpanded){invalidateRequests(activityGate);return;}
    const token=beginRequest(activityGate);
    setActivityLoading(true);
    fetchRecentHouseholdActivity(household.id,10)
      .then(rows=>{if(isCurrentRequest(activityGate,token))setActivity(rows);})
      .catch(()=>{})
      .finally(()=>{if(isCurrentRequest(activityGate,token))setActivityLoading(false);});
    return()=>{invalidateRequests(activityGate);};
  },[demo,household.id,activityExpanded,activityGate]);

  useEffect(()=>{
    const client=supabase;
    if(demo||!client||!activityExpanded)return;
    const channel=client.channel(`household-activity-${household.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'household_activity',filter:`household_id=eq.${household.id}`},()=>{
        const token=beginRequest(activityGate);
        fetchRecentHouseholdActivity(household.id,10).then(rows=>{if(isCurrentRequest(activityGate,token))setActivity(rows);}).catch(()=>{});
      }).subscribe();
    return()=>{void client.removeChannel(channel);invalidateRequests(activityGate);};
  },[demo,household.id,activityExpanded,activityGate]);

  const activityText=(item:HouseholdActivity)=>{
    const name=item.actor_name||locale.t('activity.someone');
    const detail=item.details??{};
    const mealType=String(detail.meal_type??'dinner');
    const meal=locale.t(`meal.${mealType}` as any);
    const label=String(detail.label??'');
    const title=String(detail.title??'');
    switch(item.event_type){
      case'meal_updated':return locale.t('activity.mealUpdated',{name,meal});
      case'meal_deleted':return locale.t('activity.mealDeleted',{name,meal});
      case'shopping_checked':return locale.t('activity.shoppingChecked',{name,item:label});
      case'shopping_unchecked':return locale.t('activity.shoppingUnchecked',{name,item:label});
      case'recipe_added':return locale.t('activity.recipeAdded',{name,title});
      case'meal_idea_added':return locale.t('activity.ideaAdded',{name,title});
      default:return name;
    }
  };

  const invite=async()=>{
    if(loading||inviteInFlight.current)return;
    if(!familyAccess){setPaywallOpen(true);return;}
    if(demo){setCode('DEMO24');return;}
    inviteInFlight.current=true;setLoading(true);setError('');
    try{setCode(await createInvitation(household.id));}
    catch(e:any){
      const gate=classifyPremiumGateError(e);
      if(gate==='FAMILY_PLAN_REQUIRED'){
        try{await onRefreshAccess?.();}catch{}
        setPaywallOpen(true);
        setError(locale.t('dashboard.familyRequired'));
      }else if(gate==='HOUSEHOLD_MEMBER_LIMIT')setError(locale.t('dashboard.memberLimit'));
      else setError(locale.t('dashboard.inviteError'));
    }
    finally{inviteInFlight.current=false;setLoading(false);}
  };

  const shareInvite=async()=>{if(!code)return;const link=inviteLinkForCode(code);await Share.share({message:locale.t('dashboard.inviteMessage',{household:household.name,code,link})});};

  const openPrefs=()=>{
    setAllergies(prefs.allergies.join(', '));
    setDiets(prefs.diets.join(', '));
    setDisliked(prefs.disliked_foods.join(', '));
    setPrefsOpen(true);
  };
  const myMember=members.find(m=>m.user_id===myUserId)??members[0]??null;

  const chooseAvatar=async()=>{
    if(avatarInFlight.current)return;avatarInFlight.current=true;setAvatarBusy(true);setAvatarError('');
    try{
      const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
      if(!permission.granted){setAvatarError(locale.t('dashboard.avatarPermission'));return;}
      const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.7,base64:true});
      if(result.canceled||!result.assets?.[0])return;
      const asset=result.assets[0];
      if(!asset.base64){setAvatarError(locale.t('dashboard.avatarReadError'));return;}
      if(demo){
        setMembers(prev=>prev.map(m=>m.user_id===myUserId?{...m,avatar_url:asset.uri}:m));
      }else{
        await uploadMyAvatar({base64:asset.base64,mimeType:asset.mimeType});
        setMembers(await fetchHouseholdMembers(household.id));
      }
    }catch{
      setAvatarError(locale.t('dashboard.avatarSaveError'));
    }finally{avatarInFlight.current=false;setAvatarBusy(false);}
  };

  const deleteAvatar=async()=>{
    if(avatarInFlight.current)return;avatarInFlight.current=true;setAvatarError('');
    setAvatarBusy(true);
    try{
      if(demo)setMembers(prev=>prev.map(m=>m.user_id===myUserId?{...m,avatar_url:null,avatar_path:null}:m));
      else{await removeMyAvatar();setMembers(await fetchHouseholdMembers(household.id));}
    }catch{setAvatarError(locale.t('dashboard.avatarRemoveError'));}
    finally{avatarInFlight.current=false;setAvatarBusy(false);}
  };

  const split=(s:string)=>s.split(',').map(x=>x.trim()).filter(Boolean);
  const savePrefs=async()=>{
    const next={allergies:split(allergies),diets:split(diets),disliked_foods:split(disliked)};
    if(!displayName.trim()||displayName.trim().length<2){setError(locale.t('dashboard.invalidName'));return;}
    if(prefsInFlight.current)return;prefsInFlight.current=true;setPrefsSaving(true);setPrefs(next);
    try{
      if(!demo){
        await Promise.all([saveMyPreferences(next),updateMyDisplayName(displayName)]);
        setMembers(await fetchHouseholdMembers(household.id));
      }else{
        setMembers(prev=>prev.map((m,i)=>i===0?{...m,...next,display_name:displayName.trim()}:m));
      }
      setPrefsOpen(false);
    }catch(e:any){setError(e?.message??locale.t('dashboard.preferencesError'));}
    finally{prefsInFlight.current=false;setPrefsSaving(false);}
  };

  return <>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={household.name} subtitle={locale.t('dashboard.subtitle')}/>
      <View style={styles.card}><Text style={[styles.section,rtl&&styles.rtl]}>{locale.t('dashboard.members')}</Text>
        {members.length?members.map((m,i)=><View key={m.user_id} style={[styles.member,i>0&&styles.memberBorder]}>{m.avatar_url?<Image source={{uri:m.avatar_url}} style={styles.avatarImage}/>:<Text style={styles.avatar}>{m.display_name.slice(0,1).toUpperCase()}</Text>}<View style={{flex:1}}><Text style={[styles.name,rtl&&styles.rtl]}>{m.display_name}</Text><Text style={[styles.role,rtl&&styles.rtl]}>{locale.t(m.role==='admin'?'common.admin':'common.member')}</Text></View></View>):<Text style={[styles.empty,rtl&&styles.rtl]}>{locale.t('dashboard.loadingMembers')}</Text>}
        <SettingRow title={locale.t('dashboard.profile')} value={locale.t('dashboard.preferences')} onPress={openPrefs} rtl={rtl}/>
        {household.role==='admin'&&<Pressable accessibilityRole="button" onPress={invite} disabled={loading} accessibilityState={{disabled:loading,busy:loading}} style={[styles.member,styles.memberBorder,loading&&{opacity:.6}]}><Text style={styles.avatar}>＋</Text><View style={{flex:1}}><Text style={[styles.name,rtl&&styles.rtl]}>{locale.t('dashboard.invite')}</Text><Text style={[styles.role,rtl&&styles.rtl]}>{code?`Code : ${code}`:locale.t('dashboard.createCode')}</Text></View>{loading?<ActivityIndicator color={colors.sageDark}/>:null}</Pressable>}{code?<Pressable accessibilityRole="button" onPress={shareInvite} style={styles.shareInvite}><Text style={styles.shareInviteText}>{locale.t('dashboard.shareInvite')}</Text></Pressable>:null}{error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,rtl&&styles.rtl]}>{error}</Text>:null}
      </View>

      <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{expanded:settingsExpanded}} onPress={()=>setSettingsExpanded(v=>!v)} style={styles.settingsHeader}>
          <View style={{flex:1}}><Text style={[styles.section,styles.sectionNoMargin,rtl&&styles.rtl]}>{locale.t('dashboard.settings')}</Text><Text style={[styles.settingsSummary,rtl&&styles.rtl]}>{locale.t('dashboard.settingsSummary')}</Text></View>
          <Text style={styles.activityArrow}>{settingsExpanded?'⌃':'⌄'}</Text>
        </Pressable>
        {settingsExpanded?<>
          <SettingRow title={locale.t('dashboard.reminders')} value={locale.t('dashboard.remindersSummary')} onPress={()=>setNotificationsOpen(true)} rtl={rtl}/>
          <SettingRow title={locale.t('settings.languageTitle')} value={`${locale.language.toUpperCase()} · ${locale.measurementSystem}`} onPress={()=>setLanguageOpen(true)} rtl={rtl}/>
          <SettingRow title={locale.t('settings.appearanceTitle')} value={locale.t(theme.preference==='system'?'settings.themeSystem':theme.preference==='dark'?'settings.themeDark':'settings.themeLight')} onPress={()=>setThemeOpen(true)} rtl={rtl}/>
          <SettingRow title={locale.t('privacy.dashboardTitle')} value={locale.t('privacy.dashboardValue')} onPress={()=>setPrivacyOpen(true)} rtl={rtl}/>
        </>:null}
      </View>

      <Pressable accessibilityRole="button" accessibilityState={{expanded:activityExpanded}} onPress={()=>setActivityExpanded(v=>!v)} style={styles.card}>
        <View style={styles.activityHeader}>
          <View style={{flex:1}}><Text style={[styles.section,styles.sectionNoMargin,rtl&&styles.rtl]}>{locale.t('activity.title')}</Text><Text style={[styles.activityPrivacy,rtl&&styles.rtl]}>{locale.t('activity.private')}</Text></View>
          <Text style={styles.activityArrow}>{activityExpanded?'⌃':'⌄'}</Text>
        </View>
        {activityExpanded?(activityLoading?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={{marginVertical:12}}/>:activity.length?activity.map((item,index)=><View key={item.id} style={[styles.activityRow,index>0&&styles.memberBorder]}><View style={styles.activityDot}/><View style={{flex:1}}><Text style={[styles.activityText,rtl&&styles.rtl]}>{activityText(item)}</Text><Text style={[styles.activityTime,rtl&&styles.rtl]}>{locale.formatDate(new Date(item.created_at),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</Text></View></View>):<EmptyState title={locale.t('activity.emptyTitle')} description={locale.t('activity.emptyText')} rtl={rtl} compact/>):null}
      </Pressable>

      <Pressable accessibilityRole="button" onPress={()=>setPaywallOpen(true)} style={styles.accountRow}><View style={{flex:1}}><Text style={[styles.accountLabel,rtl&&styles.rtl]}>{locale.t('dashboard.offer')}</Text><Text style={[styles.accountTitle,rtl&&styles.rtl]}>{locale.t(familyAccess?'paywall.family':'paywall.free')}</Text><Text style={[styles.accountText,rtl&&styles.rtl]}>{access.plan==='trial'&&trialDays>0?locale.t('dashboard.trialRemaining',{count:trialDays}):locale.t(familyAccess?'dashboard.familyDesc':'dashboard.freeDesc')}</Text></View><Text style={styles.arrow}>›</Text></Pressable>

      <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signout}><Text style={styles.signoutText}>{locale.t(demo?'dashboard.exitDemo':'dashboard.signOut')}</Text></Pressable>
    </ScrollView>

    <Modal visible={notificationsOpen} animationType="slide" onRequestClose={()=>setNotificationsOpen(false)}><NotificationSettingsScreen onClose={()=>setNotificationsOpen(false)}/></Modal>
    <Modal visible={languageOpen} animationType="slide" onRequestClose={()=>setLanguageOpen(false)}><LanguageSettingsScreen onClose={()=>setLanguageOpen(false)}/></Modal>
    <Modal visible={themeOpen} animationType="slide" onRequestClose={()=>setThemeOpen(false)}><ThemeSettingsScreen onClose={()=>setThemeOpen(false)}/></Modal>
    <Modal visible={privacyOpen} animationType="slide" onRequestClose={()=>setPrivacyOpen(false)}><PrivacyDataScreen householdId={household.id} demo={demo} onClose={()=>setPrivacyOpen(false)}/></Modal>
    <Modal visible={paywallOpen} animationType="slide" onRequestClose={()=>setPaywallOpen(false)}><PaywallScreen access={access} demo={demo} onClose={()=>setPaywallOpen(false)} onStartTrial={!demo&&access.plan==='free'&&onStartTrial?async()=>{await onStartTrial();setPaywallOpen(false);}:undefined}/></Modal>

    <Modal visible={prefsOpen} animationType="slide" onRequestClose={()=>setPrefsOpen(false)}>
      <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHeader}><Text style={[styles.modalTitle,rtl&&styles.rtl]}>{locale.t('dashboard.profile')}</Text><Text accessibilityRole="button" onPress={()=>setPrefsOpen(false)} style={styles.close}>{locale.t('common.close')}</Text></View>
        <View style={styles.avatarEditor}>
          {myMember?.avatar_url?<Image source={{uri:myMember.avatar_url}} style={styles.avatarEditorImage}/>:<View style={styles.avatarEditorFallback}><Text style={styles.avatarEditorInitial}>{displayName.slice(0,1).toUpperCase()||'•'}</Text></View>}
          <View style={styles.avatarEditorActions}>
            <Text style={[styles.fieldLabel,rtl&&styles.rtl]}>{locale.t('dashboard.avatarTitle')}</Text>
            <Text style={[styles.avatarHelp,rtl&&styles.rtl]}>{locale.t('dashboard.avatarHelp')}</Text>
            <View style={styles.avatarButtons}>
              <Pressable accessibilityRole="button" disabled={avatarBusy} accessibilityState={{disabled:avatarBusy,busy:avatarBusy}} onPress={chooseAvatar} style={[styles.avatarButton,avatarBusy&&{opacity:.5}]}><Text style={styles.avatarButtonText}>{locale.t('dashboard.avatarChoose')}</Text></Pressable>
              {myMember?.avatar_url?<Pressable accessibilityRole="button" disabled={avatarBusy} accessibilityState={{disabled:avatarBusy,busy:avatarBusy}} onPress={deleteAvatar} style={[styles.avatarRemoveButton,avatarBusy&&{opacity:.5}]}><Text style={styles.avatarRemoveText}>{locale.t('dashboard.avatarRemove')}</Text></Pressable>:null}
            </View>
            {avatarBusy?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} size="small" color={colors.sageDark} style={{alignSelf:'flex-start',marginTop:8}}/>:null}
            {avatarError?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,rtl&&styles.rtl]}>{avatarError}</Text>:null}
          </View>
        </View>
        <PrefField label={locale.t('dashboard.displayName')} value={displayName} onChange={setDisplayName} placeholder={locale.t('dashboard.displayNamePlaceholder')} rtl={rtl}/>
        <PrefField label={locale.t('dashboard.allergiesField')} value={allergies} onChange={setAllergies} placeholder={locale.t('dashboard.allergiesPlaceholder')} rtl={rtl}/>
        <PrefField label={locale.t('dashboard.dietsField')} value={diets} onChange={setDiets} placeholder={locale.t('dashboard.dietsPlaceholder')} rtl={rtl}/>
        <PrefField label={locale.t('dashboard.dislikesField')} value={disliked} onChange={setDisliked} placeholder={locale.t('dashboard.dislikesPlaceholder')} rtl={rtl}/>
        <Text style={[styles.help,rtl&&styles.rtl]}>{locale.t('dashboard.commaHelp')}</Text>
        <Pressable accessibilityRole="button" onPress={savePrefs} disabled={prefsSaving} accessibilityState={{disabled:prefsSaving,busy:prefsSaving}} style={[styles.save,prefsSaving&&{opacity:.5}]}><Text style={styles.saveText}>{locale.t('common.save')}</Text></Pressable>
      </ScrollView>
    </Modal>
  </>;
}

function SettingRow({title,value,onPress,rtl=false}:{title:string;value:string;onPress:()=>void;rtl?:boolean}){return <Pressable accessibilityRole="button" onPress={onPress} style={styles.setting}><View style={{flex:1}}><Text style={[styles.settingTitle,rtl&&styles.rtl]}>{title}</Text><Text style={[styles.settingValue,rtl&&styles.rtl]}>{value}</Text></View><Text style={styles.arrow}>›</Text></Pressable>}
function PrefField({label,value,onChange,placeholder,rtl=false}:{label:string;value:string;onChange:(s:string)=>void;placeholder:string;rtl?:boolean}){return <View style={{marginTop:18}}><Text style={[styles.fieldLabel,rtl&&styles.rtl]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.placeholder} style={[styles.fieldInput,rtl&&styles.rtl]}/></View>}

const styles=StyleSheet.create({
  content:{padding:20,paddingBottom:28},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:16,marginTop:18},section:{color:colors.muted,fontSize:11,letterSpacing:1.1,fontWeight:'800',marginBottom:10},sectionNoMargin:{marginBottom:0},member:{flexDirection:'row',alignItems:'center',paddingVertical:10,gap:12},memberBorder:{borderTopWidth:1,borderTopColor:colors.border},avatar:{width:42,height:42,textAlign:'center',textAlignVertical:'center',fontSize:17,fontWeight:'900',color:colors.sageDark,backgroundColor:colors.sageSoft,borderRadius:14,paddingTop:10},avatarImage:{width:42,height:42,borderRadius:14,backgroundColor:colors.sageSoft},name:{color:colors.ink,fontSize:15,fontWeight:'800'},role:{color:colors.muted,fontSize:12,marginTop:3},empty:{color:colors.muted,fontSize:12,paddingVertical:8},setting:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:58,borderTopWidth:1,borderTopColor:colors.border},settingTitle:{color:colors.ink,fontSize:14,fontWeight:'700'},settingValue:{color:colors.muted,fontSize:11,marginTop:3,maxWidth:260},arrow:{color:colors.iconMuted,fontSize:28},signout:{minHeight:50,borderWidth:1,borderColor:colors.warningBorder,borderRadius:radius.md,alignItems:'center',justifyContent:'center',marginTop:18},signoutText:{color:colors.warningText,fontWeight:'800'},shareInvite:{minHeight:42,borderRadius:12,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center',marginTop:8},shareInviteText:{color:colors.sageDark,fontSize:12,fontWeight:'800'},error:{color:colors.error,fontSize:12,marginTop:6},settingsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,minHeight:34},settingsSummary:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:4},activityHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},activityPrivacy:{color:colors.muted,fontSize:9,fontWeight:'700',marginTop:3},activityArrow:{color:colors.iconMuted,fontSize:22,fontWeight:'900'},activityRow:{flexDirection:'row',gap:10,paddingVertical:10,alignItems:'flex-start'},activityDot:{width:8,height:8,borderRadius:4,backgroundColor:colors.sageDark,marginTop:5},activityText:{color:colors.ink,fontSize:12,fontWeight:'700',lineHeight:17},activityTime:{color:colors.muted,fontSize:10,marginTop:3},accountRow:{flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.border,paddingVertical:14,marginTop:18},accountLabel:{color:colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1},accountTitle:{color:colors.ink,fontSize:14,fontWeight:'800',marginTop:3},accountText:{color:colors.muted,fontSize:10,lineHeight:15,marginTop:2,maxWidth:280},
  modalContent:{padding:22,paddingTop:60,paddingBottom:50,backgroundColor:colors.cream,minHeight:'100%'},modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},modalTitle:{fontSize:28,fontWeight:'800',color:colors.ink},close:{color:colors.sageDark,fontWeight:'800'},avatarEditor:{flexDirection:'row',gap:14,alignItems:'center',marginTop:22,marginBottom:4},avatarEditorImage:{width:76,height:76,borderRadius:24,backgroundColor:colors.sageSoft},avatarEditorFallback:{width:76,height:76,borderRadius:24,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},avatarEditorInitial:{fontSize:28,fontWeight:'900',color:colors.sageDark},avatarEditorActions:{flex:1},avatarHelp:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:2},avatarButtons:{flexDirection:'row',gap:8,marginTop:8},avatarButton:{minHeight:38,borderRadius:11,backgroundColor:colors.sageSoft,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},avatarButtonText:{color:colors.sageDark,fontSize:11,fontWeight:'800'},avatarRemoveButton:{minHeight:38,borderRadius:11,borderWidth:1,borderColor:colors.warningBorder,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},avatarRemoveText:{color:colors.warningText,fontSize:11,fontWeight:'800'},fieldLabel:{color:colors.ink,fontWeight:'800',fontSize:13,marginBottom:7},fieldInput:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:15,minHeight:52,paddingHorizontal:14,color:colors.ink},help:{color:colors.muted,fontSize:11,marginTop:14},save:{backgroundColor:colors.sageDark,minHeight:54,borderRadius:16,alignItems:'center',justifyContent:'center',marginTop:24},saveText:{color:colors.onAccent,fontWeight:'800',fontSize:16},rtl:{textAlign:'right',writingDirection:'rtl'}
});
