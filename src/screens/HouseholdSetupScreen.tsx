import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '../components/PrimaryButton';
import {useLocale} from '../context/LocaleContext';
import {getMyDisplayName} from '../services/profiles';
import {colors,radius} from '../theme';
import {liaFamilyFormPayload,liaFamilyFormSoftGaps,validateLiaFamilyForm,type LiaFamilyFormDraft,type LiaFamilyPersonDraft,type LiaFamilyRelation,type LiaRelationshipStatus,type LiaSalutation} from '../lib/liaFamilyForm';
import {applyLiaProfileProposal,liaProfileProposalFromTranscript,type LiaProfileFillProposal,type LiaProfilePatch} from '../lib/liaProfileFormAssistant';
import {startLiaFormDictation,stopLiaFormDictation} from '../services/liaFormDictation';
import type {HouseholdFamilySetupPayload} from '../services/households';

type Props={householdName:string;onComplete:(payload:HouseholdFamilySetupPayload)=>Promise<void>|void};
const blankPerson=(relation:LiaFamilyRelation):LiaFamilyPersonDraft=>({relation,relationLabel:'',salutation:'other',firstName:'',age:'',phone:''});

export function HouseholdSetupScreen({householdName,onComplete}:Props){
  const locale=useLocale();const rtl=locale.textDirection==='rtl';
  const[draft,setDraft]=useState<LiaFamilyFormDraft>({salutation:'other',firstName:'',age:'',phone:'',relationshipStatus:'',members:[]});
  const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[issues,setIssues]=useState<ReturnType<typeof validateLiaFamilyForm>>([]);const submitInFlight=useRef(false);
  const[dictating,setDictating]=useState(false);const[dictationText,setDictationText]=useState('');const[dictationNotice,setDictationNotice]=useState('');const[proposal,setProposal]=useState<LiaProfileFillProposal|null>(null);
  useEffect(()=>{let active=true;getMyDisplayName().then(value=>{if(active&&value&&value.toLowerCase()!=='member')setDraft(v=>({...v,firstName:value}));}).catch(()=>{});return()=>{active=false;void stopLiaFormDictation();};},[]);
  const issueText=useMemo(()=>issues.map(issue=>{const who=issue.scope==='organizer'?locale.t('householdSetup.you'):draft.members[issue.index??0]?.firstName.trim()||locale.t('householdSetup.person',{count:(issue.index??0)+1});return locale.t(`householdSetup.issue.${issue.code}` as any,{name:who});}),[issues,draft.members,locale]);
  const setOrganizer=(key:'salutation'|'firstName'|'age'|'phone',value:string)=>{setIssues([]);setDraft(v=>({...v,[key]:value}));};
  const addMember=(relation:LiaFamilyRelation)=>{setIssues([]);setDraft(v=>({...v,members:[...v.members,blankPerson(relation)]}));};
  const updateMember=(index:number,patch:Partial<LiaFamilyPersonDraft>)=>{setIssues([]);setDraft(v=>({...v,members:v.members.map((m,i)=>i===index?{...m,...patch}:m)}));};
  const removeMember=(index:number)=>{setIssues([]);setDraft(v=>({...v,members:v.members.filter((_,i)=>i!==index)}));};
  const finish=async()=>{const nextIssues=validateLiaFamilyForm(draft);setIssues(nextIssues);setError('');if(nextIssues.length)return;if(submitInFlight.current)return;submitInFlight.current=true;setLoading(true);try{void liaFamilyFormSoftGaps(draft);await onComplete(liaFamilyFormPayload(draft));}catch{setError(locale.t('householdSetup.error'));}finally{submitInFlight.current=false;setLoading(false);}};
  const stopDictation=async()=>{await stopLiaFormDictation();setDictating(false);};
  const beginDictation=async()=>{
    if(dictating){await stopDictation();return;}
    setProposal(null);setDictationNotice('');setDictationText('');
    const started=await startLiaFormDictation(locale.languageTag,{onPartial:text=>setDictationText(text),onFinal:text=>{setDictating(false);setDictationText(text);const next=liaProfileProposalFromTranscript(text,draft);if(next.patches.length)setProposal(next);else setDictationNotice(locale.t('householdSetup.dictationNoMatch'));}}).catch(()=>false);
    if(!started){setDictating(false);setDictationNotice(locale.t('householdSetup.dictationUnavailable'));return;}
    setDictating(true);
  };
  const confirmProposal=()=>{if(!proposal)return;setDraft(current=>applyLiaProfileProposal(current,proposal,true));setIssues([]);setProposal(null);setDictationNotice('');};
  const cancelProposal=()=>{setProposal(null);setDictationNotice('');};
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <View style={styles.liaBadge}><Text style={styles.liaBadgeText}>LIA</Text></View>
    <Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('householdSetup.kicker')}</Text>
    <Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('householdSetup.formTitle')}</Text>
    <Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('householdSetup.formSubtitle',{household:householdName})}</Text>
    <View style={styles.confidanteNote}><Text style={[styles.confidanteNoteText,rtl&&styles.rtl]}>{locale.t('householdSetup.confidanteNote')}</Text></View>

    <View style={styles.card}><Text style={[styles.sectionTitle,rtl&&styles.rtl]}>{locale.t('householdSetup.organizer')}</Text>
      <ChoiceRow values={['mr','mrs','other']} selected={draft.salutation} onSelect={value=>setOrganizer('salutation',value)} labels={[locale.t('householdSetup.mr'),locale.t('householdSetup.mrs'),locale.t('householdSetup.otherSalutation')]}/>
      <Text style={[styles.label,rtl&&styles.rtl]}>{locale.t('householdSetup.relationshipStatus')}</Text>
      <RelationshipChoiceRow selected={draft.relationshipStatus} onSelect={value=>{setIssues([]);setDraft(v=>({...v,relationshipStatus:value}));}} labels={[locale.t('householdSetup.statusSingle'),locale.t('householdSetup.statusMarried'),locale.t('householdSetup.statusDivorced'),locale.t('householdSetup.statusPartnered')]}/>
      <Field label={locale.t('householdSetup.firstName')} value={draft.firstName} onChange={v=>setOrganizer('firstName',v)} placeholder={locale.t('householdSetup.namePlaceholder')} rtl={rtl}/>
      <View style={styles.twoCols}><Field compact label={locale.t('householdSetup.ageOptional')} value={draft.age} onChange={v=>setOrganizer('age',v.replace(/\D/g,'').slice(0,3))} keyboard="number-pad" rtl={rtl}/><Field compact label={locale.t('householdSetup.phone')} value={draft.phone} onChange={v=>setOrganizer('phone',v)} keyboard="phone-pad" rtl={rtl}/></View>
    </View>

    <Text style={[styles.sectionHeading,rtl&&styles.rtl]}>{locale.t('householdSetup.family')}</Text>
    <Text style={[styles.hint,rtl&&styles.rtl]}>{locale.t('householdSetup.familyHint')}</Text>
    <View style={styles.ageHint}><Text style={[styles.ageHintText,rtl&&styles.rtl]}>{locale.t('householdSetup.ageContextHint')}</Text></View>
    {draft.members.map((member,index)=><MemberCard key={`${index}-${member.relation}`} member={member} index={index} rtl={rtl} locale={locale} onChange={patch=>updateMember(index,patch)} onRemove={()=>removeMember(index)}/>) }
    <View style={styles.addRow}><AddButton label={locale.t('householdSetup.addSpouse')} onPress={()=>addMember('spouse')}/><AddButton label={locale.t('householdSetup.addChild')} onPress={()=>addMember('child')}/><AddButton label={locale.t('householdSetup.addOther')} onPress={()=>addMember('other')}/></View>

    <View style={styles.dictationCard}>
      <Text style={[styles.dictationHint,rtl&&styles.rtl]}>{locale.t('householdSetup.dictationHint')}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{busy:dictating,selected:dictating}} onPress={()=>void beginDictation()} style={[styles.dictationButton,dictating&&styles.dictationButtonActive]}><Text style={[styles.dictationButtonText,dictating&&styles.dictationButtonTextActive]}>{dictating?locale.t('householdSetup.dictationListening'):locale.t('householdSetup.tellLia')}</Text></Pressable>
      {dictationText?<Text style={[styles.dictationTranscript,rtl&&styles.rtl]}>{locale.t('householdSetup.dictationTranscript',{text:dictationText})}</Text>:null}
      {dictationNotice?<Text accessibilityRole="alert" style={[styles.dictationNotice,rtl&&styles.rtl]}>{dictationNotice}</Text>:null}
      {proposal?<View style={styles.proposal}><Text style={[styles.proposalTitle,rtl&&styles.rtl]}>{locale.t('householdSetup.dictationReview')}</Text>{proposal.patches.map((patch,index)=><Text key={`${patch.kind}-${index}`} style={[styles.proposalLine,rtl&&styles.rtl]}>• {proposalLine(locale,patch)}</Text>)}<View style={styles.proposalActions}><Pressable accessibilityRole="button" onPress={confirmProposal} style={styles.confirm}><Text style={styles.confirmText}>{locale.t('householdSetup.dictationConfirm')}</Text></Pressable><Pressable accessibilityRole="button" onPress={cancelProposal} style={styles.cancel}><Text style={styles.cancelText}>{locale.t('householdSetup.dictationCancel')}</Text></Pressable></View></View>:null}
    </View>

    {issueText.length?<View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.liaCheck}><Text style={[styles.liaCheckTitle,rtl&&styles.rtl]}>{locale.t('householdSetup.checkTitle')}</Text>{issueText.map((text,index)=><Text key={`${text}-${index}`} style={[styles.liaCheckText,rtl&&styles.rtl]}>• {text}</Text>)}</View>:null}
    {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error,rtl&&styles.rtl]}>{error}</Text>:null}
    {loading?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark}/>:<PrimaryButton label={locale.t('householdSetup.finishForm')} onPress={()=>{void finish();}}/>}
    <Text style={[styles.note,rtl&&styles.rtl]}>{locale.t('householdSetup.note')}</Text>
  </ScrollView></SafeAreaView>;
}

function proposalLine(locale:ReturnType<typeof useLocale>,patch:LiaProfilePatch):string{
  if(patch.kind==='relationship_status'){
    const key=patch.value==='single'?'householdSetup.statusSingle':patch.value==='married'?'householdSetup.statusMarried':patch.value==='divorced'?'householdSetup.statusDivorced':'householdSetup.statusPartnered';
    return `${locale.t('householdSetup.relationshipStatus')}: ${locale.t(key)}`;
  }
  if(patch.kind==='organizer_age')return `${locale.t('householdSetup.ageOptional')}: ${patch.value}`;
  if(patch.kind==='organizer_phone')return `${locale.t('householdSetup.phone')}: ${patch.value}`;
  if(patch.kind==='member_age')return `${patch.memberName} · ${locale.t('householdSetup.ageOptional')}: ${patch.value}`;
  return `${patch.memberName} · ${locale.t('householdSetup.phone')}: ${patch.value}`;
}

function MemberCard({member,index,rtl,locale,onChange,onRemove}:{member:LiaFamilyPersonDraft;index:number;rtl:boolean;locale:ReturnType<typeof useLocale>;onChange:(patch:Partial<LiaFamilyPersonDraft>)=>void;onRemove:()=>void}){
  return <View style={styles.card}><View style={styles.cardHead}><Text style={[styles.sectionTitle,rtl&&styles.rtl]}>{locale.t(member.relation==='spouse'?'householdSetup.spouse':member.relation==='child'?'householdSetup.child':'householdSetup.otherPerson')} {index+1}</Text><Pressable accessibilityRole="button" onPress={onRemove} style={styles.remove}><Text style={styles.removeText}>{locale.t('householdSetup.remove')}</Text></Pressable></View>
    {member.relation!=='child'?<ChoiceRow values={['mr','mrs','other']} selected={member.salutation??'other'} onSelect={value=>onChange({salutation:value})} labels={[locale.t('householdSetup.mr'),locale.t('householdSetup.mrs'),locale.t('householdSetup.otherSalutation')]}/>:null}
    {member.relation==='other'?<Field label={locale.t('householdSetup.relation')} value={member.relationLabel??''} onChange={v=>onChange({relationLabel:v})} placeholder={locale.t('householdSetup.relationPlaceholder')} rtl={rtl}/>:null}
    <Field label={locale.t('householdSetup.firstName')} value={member.firstName} onChange={v=>onChange({firstName:v})} rtl={rtl}/>
    <View style={styles.twoCols}><Field compact label={locale.t('householdSetup.ageOptional')} value={member.age} onChange={v=>onChange({age:v.replace(/\D/g,'').slice(0,3)})} keyboard="number-pad" rtl={rtl}/><Field compact label={locale.t(member.relation==='child'?'householdSetup.phoneOptional':'householdSetup.phone')} value={member.phone} onChange={v=>onChange({phone:v})} keyboard="phone-pad" rtl={rtl}/></View>
  </View>;
}
function ChoiceRow({values,selected,onSelect,labels}:{values:LiaSalutation[];selected:LiaSalutation;onSelect:(v:LiaSalutation)=>void;labels:string[]}){return <View style={styles.choiceRow}>{values.map((value,index)=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:selected===value}} onPress={()=>onSelect(value)} style={[styles.choice,selected===value&&styles.choiceActive]}><Text style={[styles.choiceText,selected===value&&styles.choiceTextActive]}>{labels[index]}</Text></Pressable>)}</View>}
function RelationshipChoiceRow({selected,onSelect,labels}:{selected:LiaRelationshipStatus|'';onSelect:(v:LiaRelationshipStatus)=>void;labels:string[]}){const values:LiaRelationshipStatus[]=['single','married','divorced','partnered'];return <View style={styles.choiceRow}>{values.map((value,index)=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:selected===value}} onPress={()=>onSelect(value)} style={[styles.choice,selected===value&&styles.choiceActive]}><Text style={[styles.choiceText,selected===value&&styles.choiceTextActive]}>{labels[index]}</Text></Pressable>)}</View>}
function Field({label,value,onChange,placeholder='',keyboard='default',compact=false,rtl=false}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;keyboard?:'default'|'number-pad'|'phone-pad';compact?:boolean;rtl?:boolean}){return <View style={[styles.field,compact&&styles.compact]}><Text style={[styles.label,rtl&&styles.rtl]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.placeholder} keyboardType={keyboard} autoCapitalize="words" style={[styles.input,rtl&&styles.rtl]}/></View>}
function AddButton({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" onPress={onPress} style={styles.add}><Text style={styles.addText}>+ {label}</Text></Pressable>}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},container:{padding:22,paddingBottom:48},liaBadge:{alignSelf:'flex-start',backgroundColor:colors.sageDark,borderRadius:999,paddingHorizontal:14,paddingVertical:7,marginBottom:16},liaBadgeText:{color:colors.onAccent,fontWeight:'900',letterSpacing:1.4},confidanteNote:{backgroundColor:colors.sageCard,borderRadius:radius.md,padding:14,marginTop:14},confidanteNoteText:{color:colors.sageDark,fontSize:13,lineHeight:19,fontWeight:'700'},kicker:{color:colors.orange,fontSize:12,fontWeight:'900',letterSpacing:1.1},title:{color:colors.ink,fontSize:30,lineHeight:37,fontWeight:'900',marginTop:8},subtitle:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:10},sectionHeading:{color:colors.ink,fontSize:18,fontWeight:'900',marginTop:24},hint:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:6,marginBottom:4},ageHint:{backgroundColor:colors.sageCard,borderRadius:radius.md,padding:12,marginTop:8},ageHintText:{color:colors.sageDark,fontSize:11,lineHeight:17,fontWeight:'700'},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:16,marginTop:14},cardHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},sectionTitle:{color:colors.ink,fontSize:15,fontWeight:'900'},choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:12},choice:{minHeight:40,paddingHorizontal:13,borderRadius:12,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},choiceActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},choiceText:{color:colors.muted,fontSize:11,fontWeight:'800'},choiceTextActive:{color:colors.onAccent},field:{marginTop:13,flex:1},compact:{minWidth:120},label:{color:colors.ink,fontWeight:'800',fontSize:12,marginBottom:6},input:{backgroundColor:colors.input,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,minHeight:50,paddingHorizontal:13,fontSize:15,color:colors.ink},twoCols:{flexDirection:'row',gap:10},addRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},add:{minHeight:42,borderRadius:13,backgroundColor:colors.sageSoft,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},addText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},remove:{minHeight:34,paddingHorizontal:9,justifyContent:'center'},removeText:{color:colors.warningText,fontSize:10,fontWeight:'800'},dictationCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:14,marginTop:18},dictationHint:{color:colors.muted,fontSize:12,lineHeight:18},dictationButton:{marginTop:10,minHeight:44,borderRadius:13,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center',paddingHorizontal:14},dictationButtonActive:{backgroundColor:colors.sageDark},dictationButtonText:{color:colors.sageDark,fontSize:12,fontWeight:'900'},dictationButtonTextActive:{color:colors.onAccent},dictationTranscript:{color:colors.ink,fontSize:12,lineHeight:18,marginTop:10},dictationNotice:{color:colors.warningText,fontSize:12,lineHeight:18,marginTop:8},proposal:{backgroundColor:colors.sageCard,borderRadius:radius.md,padding:12,marginTop:10},proposalTitle:{color:colors.sageDark,fontWeight:'900',fontSize:12,lineHeight:18},proposalLine:{color:colors.ink,fontSize:12,lineHeight:18,marginTop:5},proposalActions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},confirm:{minHeight:40,borderRadius:12,backgroundColor:colors.sageDark,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},confirmText:{color:colors.onAccent,fontSize:11,fontWeight:'900'},cancel:{minHeight:40,borderRadius:12,borderWidth:1,borderColor:colors.border,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},cancelText:{color:colors.muted,fontSize:11,fontWeight:'900'},liaCheck:{backgroundColor:colors.orangeSoft,borderRadius:radius.md,padding:14,marginTop:18},liaCheckTitle:{color:colors.ink,fontSize:13,fontWeight:'900'},liaCheckText:{color:colors.warningText,fontSize:11,lineHeight:17,marginTop:4},error:{color:colors.error,fontSize:12,fontWeight:'700',marginTop:14},note:{color:colors.muted,fontSize:11,lineHeight:17,textAlign:'center',marginTop:12},rtl:{textAlign:'right',writingDirection:'rtl'}});
