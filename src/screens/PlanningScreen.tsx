import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';
import { addDays, localIsoDate, startOfWeek } from '../lib/dates';
import { HouseholdMember, MealGuest, MealIdea, MealMode, MealSlot, MealType, MemberAbsence, Recipe, RecipeTasteCounts } from '../types';
import { cacheMeals, clearMealSlot, copyPreviousWeek, fetchMeals, readCachedMeals, rebuildShoppingList, setMealSlot } from '../services/planning';
import { fetchRecipes } from '../services/recipes';
import { fetchHouseholdMembers } from '../services/members';
import { recipeConflicts } from '../lib/conflicts';
import { supabase } from '../lib/supabase';
import { createMealIdea, fetchMealIdeas, toggleMealIdeaVote } from '../services/mealIdeas';
import { AccessState, hasFamilyAccess } from '../services/subscription';
import { PaywallScreen } from './PaywallScreen';
import { LightParticipationScreen } from './LightParticipationScreen';
import { PresenceScreen } from './PresenceScreen';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n';
import { fetchMemberAbsences } from '../services/availability';
import { isMemberAwayForMeal } from '../lib/presence';
import { fetchRecipeTasteMap } from '../services/recipeTaste';
import { MealGlyph } from '../components/MealGlyph';
import { focusMealForHour, MEAL_ORDER } from '../domain/meals';
import { beginRequest, createRequestGate, invalidateRequests, isCurrentRequest } from '../lib/requestGate';
import { classifyPremiumGateError } from '../lib/premiumGate';
import {emitLiaFeatureFirstUse,emitLiaFeatureHelp} from '../services/liaContextualGuidance';

const mealTypes: Array<{key:MealType;labelKey:TranslationKey}> = MEAL_ORDER.map(key=>({key,labelKey:`meal.${key}` as TranslationKey}));
const demoRecipes:Recipe[]=[
  {id:'r1',title:'Lasagnes maison',prep_minutes:25,cook_minutes:40,portions:4,tags:['Famille'],ingredients:[{name:'bœuf'},{name:'tomate'},{name:'lait'}]},
  {id:'r2',title:'Saumon & légumes',prep_minutes:15,cook_minutes:20,portions:4,tags:['Rapide'],ingredients:[{name:'saumon'},{name:'courgette'}]},
  {id:'r3',title:'Curry végétarien',prep_minutes:20,cook_minutes:30,portions:4,tags:['Végétarien'],ingredients:[{name:'pois chiches'},{name:'lait de coco'}]},
];
const demoMembers:HouseholdMember[]=[
  {user_id:'u1',role:'admin',display_name:'Vous',allergies:[],diets:[],disliked_foods:[]},
  {user_id:'u2',role:'member',display_name:'Paul',allergies:['lait'],diets:[],disliked_foods:['courgette']},
  {user_id:'u3',role:'member',display_name:'Léa',allergies:[],diets:['végétarien'],disliked_foods:[]},
];

export function PlanningScreen({householdId,householdName,liaOrganizerName='',defaultPartySize=4,demo=false,weekStart,onWeekStartChange,access,onRefreshAccess,onStartTrial,onOpenShopping}:{householdId:string;householdName:string;liaOrganizerName?:string;defaultPartySize?:number;demo?:boolean;weekStart:Date;onWeekStartChange:(date:Date)=>void;access:AccessState;onRefreshAccess?:()=>Promise<AccessState>;onStartTrial?:()=>void;onOpenShopping?:()=>void}){
  const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(weekStart,i)),[weekStart]);
  const locale=useLocale();
  const todayIso=localIsoDate(new Date());
  const weekKey=localIsoDate(days[0]);
  const displayedWeekHasToday=days.some(day=>localIsoDate(day)===todayIso);
  const [meals,setMeals]=useState<MealSlot[]>([]);
  const [recipes,setRecipes]=useState<Recipe[]>(demo?demoRecipes:[]);
  const [members,setMembers]=useState<HouseholdMember[]>(demo?demoMembers:[]);
  const [absences,setAbsences]=useState<MemberAbsence[]>([]);
  const [loading,setLoading]=useState(!demo);
  const [message,setMessage]=useState('');
  const [editing,setEditing]=useState<{date:string;type:MealType}|null>(null);
  const [custom,setCustom]=useState('');
  const [selectedRecipe,setSelectedRecipe]=useState<string|null>(null);
  const [notes,setNotes]=useState('');
  const [cookUserId,setCookUserId]=useState<string|null>(null);
  const [participantIds,setParticipantIds]=useState<string[]>([]);
  const [guests,setGuests]=useState<MealGuest[]>([]);
  const [guestDraft,setGuestDraft]=useState('');
  const [servings,setServings]=useState(defaultPartySize);
  const [mealMode,setMealMode]=useState<MealMode>('fresh');
  const [leftoverFromMealId,setLeftoverFromMealId]=useState<string|null>(null);
  const [leftoverSources,setLeftoverSources]=useState<MealSlot[]>([]);
  const [saving,setSaving]=useState(false);
  const [ideas,setIdeas]=useState<MealIdea[]>(demo?[
    {id:'i1',household_id:householdId,title:'Tacos maison',recipe_id:null,proposer_name:'Paul',vote_count:2,voted_by_me:true},
    {id:'i2',household_id:householdId,title:'Curry végétarien',recipe_id:'r3',proposer_name:'Léa',vote_count:2,voted_by_me:false},
    {id:'i3',household_id:householdId,title:'Soirée crêpes',recipe_id:null,proposer_name:locale.t('planning.you'),vote_count:1,voted_by_me:false},
  ]:[]);
  const [ideasOpen,setIdeasOpen]=useState(false);
  const [ideaTitle,setIdeaTitle]=useState('');
  const [ideaRecipeId,setIdeaRecipeId]=useState<string|null>(null);
  const [ideaBusy,setIdeaBusy]=useState(false);
  const [ideaError,setIdeaError]=useState('');
  const [paywallOpen,setPaywallOpen]=useState(false);
  const [presenceOpen,setPresenceOpen]=useState(false);
  const [weekExpanded,setWeekExpanded]=useState(false);
  const [mealDetailsOpen,setMealDetailsOpen]=useState(false);
  const [lightContext,setLightContext]=useState<{date:string;type:MealType}|null>(null);
  const [myUserId,setMyUserId]=useState(demo?'u1':'');
  const [tasteByRecipe,setTasteByRecipe]=useState<Record<string,RecipeTasteCounts>>({});
  const familyAccess=hasFamilyAccess(access);
  useEffect(()=>{
    const timer=setTimeout(()=>{void emitLiaFeatureFirstUse({householdId,organizerName:liaOrganizerName,feature:'planning'});},4_500);
    return()=>clearTimeout(timer);
  },[householdId,liaOrganizerName]);
  useEffect(()=>{
    if(!editing||saving)return;
    const mealChosen=Boolean(selectedRecipe||custom.trim()||(mealMode==='leftover'&&leftoverFromMealId));
    if(mealChosen)return;
    const timer=setTimeout(()=>{emitLiaFeatureHelp({householdId,organizerName:liaOrganizerName,feature:'planning',step:'meal_choice'});},18_000);
    return()=>clearTimeout(timer);
  },[editing,saving,selectedRecipe,custom,mealMode,leftoverFromMealId,householdId,liaOrganizerName]);
  const handlePremiumRefusal=async(error:unknown)=>{
    if(classifyPremiumGateError(error)!=='FAMILY_PLAN_REQUIRED')return false;
    try{await onRefreshAccess?.();}catch{}
    setPaywallOpen(true);
    return true;
  };
  const loadGate=useRef(createRequestGate()).current;
  const ideasGate=useRef(createRequestGate()).current;
  const absencesGate=useRef(createRequestGate()).current;
  const mealMutationInFlight=useRef(false);
  const weekActionInFlight=useRef(false);
  const ideaActionInFlight=useRef(false);

  const loadIdeas=useCallback(async()=>{
    const token=beginRequest(ideasGate);
    if(demo)return;
    try{
      const next=await fetchMealIdeas(householdId);
      if(isCurrentRequest(ideasGate,token))setIdeas(next);
    }catch{}
  },[demo,householdId,ideasGate]);
  const loadAbsences=useCallback(async()=>{
    const token=beginRequest(absencesGate);
    try{
      const next=await fetchMemberAbsences(householdId,todayIso,todayIso,demo);
      if(isCurrentRequest(absencesGate,token))setAbsences(next);
    }catch{
      if(isCurrentRequest(absencesGate,token))setAbsences([]);
    }
  },[demo,householdId,todayIso,absencesGate]);
  const load=useCallback(async()=>{
    const token=beginRequest(loadGate);
    if(demo){
      const weekKey=localIsoDate(days[0]);
      const cached=await readCachedMeals(householdId,weekKey);
      if(!isCurrentRequest(loadGate,token))return;
      if(cached.length){setMeals(cached);return;}
      const seeded:MealSlot[]=[
        {id:`d1-${weekKey}`,meal_date:localIsoDate(days[0]),meal_type:'dinner',title:'Lasagnes maison',recipe_id:'r1',cook_user_id:'u1',participant_user_ids:['u1','u2','u3'],servings:3},
        {id:`d2-${weekKey}`,meal_date:localIsoDate(days[1]),meal_type:'dinner',title:'Saumon & légumes',recipe_id:'r2',cook_user_id:'u2',participant_user_ids:['u1','u2'],servings:2},
        {id:`d3-${weekKey}`,meal_date:localIsoDate(days[2]),meal_type:'dinner',title:'Curry végétarien',recipe_id:'r3',cook_user_id:'u3',participant_user_ids:['u1','u2','u3'],servings:3},
      ];
      setMeals(seeded);
      await cacheMeals(householdId,weekKey,seeded);
      return;
    }
    setLoading(true);
    try{
      const [mealData,recipeData,memberData]=await Promise.all([
        fetchMeals(householdId,localIsoDate(days[0]),localIsoDate(days[6])),
        fetchRecipes(householdId),
        fetchHouseholdMembers(householdId),
      ]);
      if(!isCurrentRequest(loadGate,token))return;
      setMeals(mealData);setRecipes(recipeData);setMembers(memberData);setMessage('');
    }catch{
      if(isCurrentRequest(loadGate,token))setMessage(locale.t('planning.loadError'));
    }finally{
      if(isCurrentRequest(loadGate,token))setLoading(false);
    }
  },[demo,householdId,days,loadGate]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    if(demo){setMyUserId('u1');return;}
    if(!supabase){setMyUserId('');return;}
    let active=true;
    supabase.auth.getUser().then(({data})=>{if(active)setMyUserId(data.user?.id??'');}).catch(()=>{if(active)setMyUserId('');});
    return()=>{active=false;};
  },[demo]);
  useEffect(()=>{loadIdeas();},[loadIdeas]);
  useEffect(()=>{loadAbsences();},[loadAbsences]);
  useEffect(()=>()=>{invalidateRequests(loadGate);invalidateRequests(ideasGate);invalidateRequests(absencesGate);},[loadGate,ideasGate,absencesGate]);
  useEffect(()=>{let active=true;fetchRecipeTasteMap(householdId,recipes.map(r=>r.id),demo).then(map=>{if(active)setTasteByRecipe(map);}).catch(()=>{if(active)setTasteByRecipe({});});return()=>{active=false;};},[householdId,recipes,demo]);
  useEffect(()=>{
    const client=supabase;
    if(demo || !client) return;
    const channel=client.channel(`planning-${householdId}-${weekKey}`).on('postgres_changes',{event:'*',schema:'public',table:'meal_plans',filter:`household_id=eq.${householdId}`},()=>{load();}).subscribe();
    return ()=>{void client.removeChannel(channel);};
  },[demo,householdId,weekKey,load]);
  useEffect(()=>{
    const client=supabase;
    if(demo || !client) return;
    const channel=client.channel(`planning-presence-${householdId}-${todayIso}`).on('postgres_changes',{event:'*',schema:'public',table:'member_absences',filter:`household_id=eq.${householdId}`},()=>{loadAbsences();}).subscribe();
    return ()=>{void client.removeChannel(channel);};
  },[demo,householdId,todayIso,loadAbsences]);

  const loadLeftoverSources=async(targetDate:string,currentSourceId?:string|null)=>{
    try{
      const from=localIsoDate(addDays(new Date(`${targetDate}T12:00:00`),-7));
      let candidates:MealSlot[]=[];
      if(demo){
        const currentWeek=await readCachedMeals(householdId,localIsoDate(days[0]));
        const previousWeek=await readCachedMeals(householdId,localIsoDate(addDays(days[0],-7)));
        candidates=[...previousWeek,...currentWeek];
      }else{
        candidates=await fetchMeals(householdId,from,targetDate);
      }
      const unique=new Map<string,MealSlot>();
      for(const meal of candidates){
        if(meal.meal_date<targetDate || meal.id===currentSourceId) unique.set(meal.id,meal);
      }
      setLeftoverSources([...unique.values()].filter(m=>m.meal_date<targetDate).sort((a,b)=>b.meal_date.localeCompare(a.meal_date)));
    }catch{setLeftoverSources([]);}
  };
  const memberName=(id?:string|null)=>members.find(m=>m.user_id===id)?.display_name;
  const isAway=(userId:string,date:string,type:MealType)=>isMemberAwayForMeal(absences,userId,date,type);
  const availableMemberIds=(date:string,type:MealType)=>members.filter(m=>!isAway(m.user_id,date,type)).map(m=>m.user_id);
  const openEditor=(date:string,type:MealType)=>{
    const current=meals.find(m=>m.meal_date===date&&m.meal_type===type);
    setEditing({date,type});
    setMealDetailsOpen(false);
    setCustom(current?.recipe_id?'':current?.title??'');
    setSelectedRecipe(current?.recipe_id??null);
    setNotes(current?.notes??'');
    setCookUserId(current?.cook_user_id??null);
    const people=current?.participant_user_ids?.length?current.participant_user_ids:availableMemberIds(date,type);
    setParticipantIds(people);
    setGuests(current?.guests??[]);
    setGuestDraft('');
    setServings(Math.max(1,Math.round(current?.servings??Math.max(defaultPartySize,people.length+(current?.guests?.length??0)))));
    setMealMode(current?.meal_mode??'fresh');
    setLeftoverFromMealId(current?.leftover_from_meal_id??null);
    void loadLeftoverSources(date,current?.leftover_from_meal_id??null);
  };
  const close=()=>{setEditing(null);setMealDetailsOpen(false);setCustom('');setSelectedRecipe(null);setNotes('');setCookUserId(null);setParticipantIds([]);setGuests([]);setGuestDraft('');setServings(defaultPartySize);setMealMode('fresh');setLeftoverFromMealId(null);setLeftoverSources([]);};
  const lightOrganizer=demo||Boolean(myUserId&&members.some(member=>member.user_id===myUserId&&member.role==='admin'));
  const openLightParticipation=()=>{
    if(!editing||!lightOrganizer||editing.date<todayIso)return;
    if(!familyAccess){setPaywallOpen(true);return;}
    const context=editing;
    close();
    setLightContext(context);
  };
  const chosenRecipe=recipes.find(r=>r.id===selectedRecipe);
  const leftoverSource=leftoverSources.find(m=>m.id===leftoverFromMealId);
  const effectiveRecipe=mealMode==='leftover'?recipes.find(r=>r.id===leftoverSource?.recipe_id):chosenRecipe;
  const selectedMembers=members.filter(m=>participantIds.includes(m.user_id));
  const currentEditingMeal=editing?meals.find(m=>m.meal_date===editing.date&&m.meal_type===editing.type):undefined;
  const mealDetailsSummary=[locale.t('planning.peopleShort',{count:participantIds.length+guests.length}),locale.t('planning.portionsShort',{count:servings}),cookUserId?locale.t('planning.cookShort',{name:memberName(cookUserId)??locale.t('common.member')}):null].filter(Boolean).join(' · ');
  const conflicts=recipeConflicts(effectiveRecipe,selectedMembers);
  const awaySelected=editing?selectedMembers.filter(m=>isAway(m.user_id,editing.date,editing.type)):[];
  const cookAway=editing&&cookUserId?isAway(cookUserId,editing.date,editing.type):false;
  const toggleParticipant=(id:string)=>setParticipantIds(prev=>{const before=Math.max(1,prev.length+guests.length);const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];setServings(current=>current===before?Math.max(1,next.length+guests.length):current);return next;});
  const addGuest=()=>{const name=guestDraft.trim();if(!name)return;const exists=guests.some(g=>g.name.toLocaleLowerCase()===name.toLocaleLowerCase());if(exists){setGuestDraft('');return;}const before=Math.max(1,participantIds.length+guests.length);const next=[...guests,{name}];setGuests(next);setGuestDraft('');setServings(current=>current===before?Math.max(1,participantIds.length+next.length):current);};
  const removeGuest=(index:number)=>{const before=Math.max(1,participantIds.length+guests.length);const next=guests.filter((_,i)=>i!==index);setGuests(next);setServings(current=>current===before?Math.max(1,participantIds.length+next.length):current);};

  const save=async()=>{
    if(!editing||mealMutationInFlight.current)return;
    if(mealMode==='leftover'&&!leftoverFromMealId)return;
    if(mealMode==='fresh'&&!chosenRecipe&&!custom.trim())return;
    mealMutationInFlight.current=true;setSaving(true);
    try{
      if(demo){
        const replacement:MealSlot={id:`demo-${editing.date}-${editing.type}`,meal_date:editing.date,meal_type:editing.type,title:mealMode==='leftover'?(leftoverSource?.title??locale.t('planning.leftovers')):(chosenRecipe?.title??custom.trim()),recipe_id:mealMode==='leftover'?null:(chosenRecipe?.id??null),notes:notes.trim()||null,cook_user_id:cookUserId,participant_user_ids:participantIds,guests,servings,meal_mode:mealMode,leftover_from_meal_id:mealMode==='leftover'?leftoverFromMealId:null};
        const next=[...meals.filter(m=>!(m.meal_date===editing.date&&m.meal_type===editing.type)),replacement];
        setMeals(next);await cacheMeals(householdId,localIsoDate(days[0]),next);
      }else{
        await setMealSlot({householdId,date:editing.date,mealType:editing.type,recipeId:mealMode==='leftover'?null:(chosenRecipe?.id??null),customTitle:mealMode==='leftover'?(leftoverSource?.title??locale.t('planning.leftovers')):(chosenRecipe?null:custom.trim()),notes:notes.trim()||null,cookUserId,participantUserIds:participantIds,guestNames:guests.map(g=>g.name),servings,mealMode,leftoverFromMealId:mealMode==='leftover'?leftoverFromMealId:null});
        await load();
      }
      close();
    }catch(e:any){if(!(await handlePremiumRefusal(e)))setMessage(locale.t('planning.saveError'));}
    finally{mealMutationInFlight.current=false;setSaving(false);}
  };
  const remove=async()=>{
    if(!editing||mealMutationInFlight.current)return;
    mealMutationInFlight.current=true;
    try{
      if(demo){const next=meals.filter(m=>!(m.meal_date===editing.date&&m.meal_type===editing.type));setMeals(next);await cacheMeals(householdId,localIsoDate(days[0]),next);}
      else{await clearMealSlot(householdId,editing.date,editing.type);await load();}
      close();
    }catch(e){if(!(await handlePremiumRefusal(e)))setMessage(locale.t('planning.saveError'));}
    finally{mealMutationInFlight.current=false;}
  };
  const reusePreviousWeek=async()=>{
    if(weekActionInFlight.current)return;weekActionInFlight.current=true;setMessage('');
    try{
      if(demo){const previousStart=addDays(days[0],-7);const previous=await readCachedMeals(householdId,localIsoDate(previousStart));if(!previous.length){setMessage(locale.t('planning.previousEmpty'));return;}const copied=previous.map((m,i)=>({...m,id:`copy-${Date.now()}-${i}`,meal_date:localIsoDate(addDays(new Date(`${m.meal_date}T12:00:00`),7))}));const next=[...meals.filter(m=>!copied.some(c=>c.meal_date===m.meal_date&&c.meal_type===m.meal_type)),...copied];setMeals(next);await cacheMeals(householdId,localIsoDate(days[0]),next);setMessage(locale.t(copied.length===1?'planning.copiedOne':'planning.copiedMany',{count:copied.length}));return;}
      try{const count=await copyPreviousWeek(householdId,localIsoDate(days[0]));await load();setMessage(count?locale.t(count===1?'planning.copiedOne':'planning.copiedMany',{count}):locale.t('planning.previousEmpty'));}catch(e:any){if(!(await handlePremiumRefusal(e)))setMessage(locale.t('planning.copyError'));}
    }finally{weekActionInFlight.current=false;}
  };
  const openIdeas=()=>{if(!familyAccess){setPaywallOpen(true);return;}setIdeaError('');setIdeasOpen(true);};
  const addIdea=async()=>{if(ideaActionInFlight.current)return;ideaActionInFlight.current=true;const title=ideaRecipeId?recipes.find(r=>r.id===ideaRecipeId)?.title??ideaTitle:ideaTitle;if(!title.trim())return;setIdeaBusy(true);setIdeaError('');try{if(demo){setIdeas(prev=>[{id:`idea-${Date.now()}`,household_id:householdId,title:title.trim(),recipe_id:ideaRecipeId,proposer_name:locale.t('planning.you'),vote_count:1,voted_by_me:true},...prev].sort((a,b)=>b.vote_count-a.vote_count));}else{await createMealIdea(householdId,title,ideaRecipeId);await loadIdeas();}setIdeaTitle('');setIdeaRecipeId(null);}catch(e:any){if(!(await handlePremiumRefusal(e)))setIdeaError(locale.t('planning.ideaSaveError'));}finally{ideaActionInFlight.current=false;setIdeaBusy(false);}};
  const voteIdea=async(idea:MealIdea)=>{
    if(ideaActionInFlight.current)return;ideaActionInFlight.current=true;
    try{
      if(demo){setIdeas(prev=>prev.map(x=>x.id===idea.id?{...x,voted_by_me:!x.voted_by_me,vote_count:Math.max(0,x.vote_count+(x.voted_by_me?-1:1))}:x).sort((a,b)=>b.vote_count-a.vote_count));return;}
      try{await toggleMealIdeaVote(householdId,idea.id,idea.voted_by_me);await loadIdeas();}catch(e:any){if(!(await handlePremiumRefusal(e)))setIdeaError(locale.t('planning.voteError'));}
    }finally{ideaActionInFlight.current=false;}
  };
  const useIdea=(idea:MealIdea)=>{if(!editing)return;if(idea.recipe_id&&recipes.some(r=>r.id===idea.recipe_id)){setSelectedRecipe(idea.recipe_id);setCustom('');}else{setSelectedRecipe(null);setCustom(idea.title);}setIdeasOpen(false);};
  const regenerate=async()=>{if(weekActionInFlight.current)return;weekActionInFlight.current=true;try{if(demo){setMessage(locale.t('planning.demoGenerated'));return;}try{await rebuildShoppingList(householdId,localIsoDate(days[0]));setMessage(locale.t('planning.shoppingUpdated'));}catch(e:any){if(!(await handlePremiumRefusal(e)))setMessage(locale.t('planning.updateError'));}}finally{weekActionInFlight.current=false;}};

  const cookingLoad=useMemo(()=>{
    const counts=new Map(members.map(member=>[member.user_id,0]));
    let unassigned=0;
    for(const meal of meals){
      if(meal.cook_user_id&&counts.has(meal.cook_user_id)) counts.set(meal.cook_user_id,(counts.get(meal.cook_user_id)??0)+1);
      else unassigned+=1;
    }
    const rows=members.map(member=>({id:member.user_id,name:member.display_name,count:counts.get(member.user_id)??0})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
    const assigned=rows.reduce((sum,row)=>sum+row.count,0);
    const active=rows.filter(row=>row.count>0).length;
    const leader=rows[0];
    const concentrated=members.length>1&&assigned>=3&&leader&&leader.count/assigned>=0.75;
    return{rows,assigned,unassigned,active,leader,concentrated};
  },[members,meals]);

  const todayMeals=useMemo(()=>mealTypes.map(type=>({type,meal:meals.find(meal=>meal.meal_date===todayIso&&meal.meal_type===type.key)})),[meals,todayIso]);
  const todayAbsenceCount=useMemo(()=>absences.filter(item=>item.absence_date===todayIso).length,[absences,todayIso]);
  const focusMealType:MealType=focusMealForHour(new Date().getHours());
  const focusType=mealTypes.find(type=>type.key===focusMealType)??mealTypes[2];
  const focusMeal=meals.find(meal=>meal.meal_date===todayIso&&meal.meal_type===focusMealType);
  const focusCook=memberName(focusMeal?.cook_user_id);
  const focusPeople=(focusMeal?.participant_user_ids?.length??availableMemberIds(todayIso,focusMealType).length)+(focusMeal?.guests?.length??0);
  const rtl=locale.textDirection==='rtl';

  return <>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeader}>
        <View style={{flex:1}}><View style={styles.householdPill}><View style={styles.householdDot}/><Text style={[styles.householdName,rtl&&styles.rtl]} numberOfLines={1}>{householdName}</Text></View><Text style={[styles.homeTitle,rtl&&styles.rtl]}>{locale.t('planning.homeTitle')}</Text><Text style={[styles.homeDate,rtl&&styles.rtl]}>{locale.formatDate(new Date(),{weekday:'long',day:'numeric',month:'long'})}</Text></View>
      </View>

      {displayedWeekHasToday?<>
        <Pressable accessibilityRole="button" onPress={()=>openEditor(todayIso,focusMealType)} style={styles.focusCard}>
          <View style={styles.focusGlowA}/><View style={styles.focusGlowB}/>
          <View style={styles.focusTop}><View style={styles.focusMealBadge}><Text style={styles.focusMealBadgeText}>{locale.t(focusType.labelKey)}</Text></View><Text style={[styles.focusLabel,rtl&&styles.rtl]}>{locale.t('planning.nextMeal')}</Text></View>
          <Text style={[styles.focusTitle,rtl&&styles.rtl]}>{focusMeal?(focusMeal.meal_mode==='leftover'?`${locale.t('planning.leftoverBadge')} · ${focusMeal.title}`:focusMeal.title):locale.t('planning.focusEmpty')}</Text>
          {focusMeal?<Text style={[styles.focusMeta,rtl&&styles.rtl]}>{[focusCook?locale.t('planning.cookShort',{name:focusCook}):'',locale.t('planning.peopleShort',{count:focusPeople}),locale.t('planning.portionsShort',{count:Math.round(focusMeal.servings??focusPeople)})].filter(Boolean).join('  ·  ')}</Text>:<Text style={[styles.focusHint,rtl&&styles.rtl]}>{locale.t('planning.focusHint')}</Text>}
          <View style={styles.focusActions}>
            <View style={styles.focusPrimary}><Text style={styles.focusPrimaryText}>{locale.t(focusMeal?'planning.editMeal':'planning.planNow')}</Text></View>
            {!focusMeal?<Pressable accessibilityRole="button" onPress={(event)=>{event.stopPropagation();openIdeas();}} style={styles.focusSecondary}><Text style={styles.focusSecondaryText}>{locale.t('planning.decide')}</Text></Pressable>:null}
          </View>
        </Pressable>

        <View style={styles.quickRow}>
          <Pressable accessibilityRole="button" onPress={()=>setPresenceOpen(true)} style={styles.quickCard}><View style={styles.quickDot}/><View style={{flex:1}}><Text style={[styles.quickTitle,rtl&&styles.rtl]}>{locale.t('planning.changePresence')}</Text><Text style={[styles.quickMeta,rtl&&styles.rtl]}>{todayAbsenceCount?locale.t('planning.awayCount',{count:todayAbsenceCount}):locale.t('planning.everyoneHere')}</Text></View><Text style={styles.quickArrow}>›</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenShopping} style={styles.quickCard}><View style={[styles.quickDot,styles.quickDotWarm]}/><View style={{flex:1}}><Text style={[styles.quickTitle,rtl&&styles.rtl]}>{locale.t('planning.shoppingCta')}</Text><Text style={[styles.quickMeta,rtl&&styles.rtl]}>{locale.t('planning.shoppingHint')}</Text></View><Text style={styles.quickArrow}>›</Text></Pressable>
        </View>

        <View style={styles.todayCompact}>
          <Text style={[styles.sectionTitle,rtl&&styles.rtl]}>{locale.t('planning.todayOverview')}</Text>
          {todayMeals.filter(({type})=>type.key!==focusMealType).map(({type,meal},index)=>{const cook=memberName(meal?.cook_user_id);const people=(meal?.participant_user_ids?.length??availableMemberIds(todayIso,type.key).length)+(meal?.guests?.length??0);return <Pressable accessibilityRole="button" key={type.key} onPress={()=>openEditor(todayIso,type.key)} style={[styles.compactMeal,index>0&&styles.compactBorder]}><MealGlyph type={type.key} size={32}/><View style={{flex:1}}><Text style={[styles.compactLabel,rtl&&styles.rtl]}>{locale.t(type.labelKey)}</Text><Text style={[styles.compactTitle,!meal&&styles.todayMealEmpty,rtl&&styles.rtl]}>{meal?(meal.meal_mode==='leftover'?`${locale.t('planning.leftoverBadge')} · ${meal.title}`:meal.title):locale.t('planning.toDecide')}</Text>{meal?<Text style={[styles.compactMeta,rtl&&styles.rtl]}>{[cook?locale.t('planning.cookShort',{name:cook}):'',locale.t('planning.peopleShort',{count:people})].filter(Boolean).join(' · ')}</Text>:null}</View><Text style={styles.quickArrow}>›</Text></Pressable>})}
        </View>
      </>:null}

      <Pressable accessibilityRole="button" onPress={()=>setWeekExpanded(value=>!value)} style={styles.weekToggle}><View><Text style={[styles.weekToggleTitle,rtl&&styles.rtl]}>{locale.t('planning.weekPlan')}</Text><Text style={[styles.weekToggleMeta,rtl&&styles.rtl]}>{days[0].getDate()}–{days[6].getDate()} · {locale.formatDate(days[0],{month:'short'})}</Text></View><Text style={styles.weekToggleArrow}>{weekExpanded?'⌃':'⌄'}</Text></Pressable>

      {weekExpanded?<View style={styles.weekSection}>
        <View style={styles.weekNav}><Pressable accessibilityRole="button" onPress={()=>onWeekStartChange(addDays(weekStart,-7))} style={styles.weekNavButton}><Text style={styles.weekNavText}>‹ {locale.t('planning.previousWeek')}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>onWeekStartChange(startOfWeek(new Date(),locale.firstWeekday))} style={styles.todayButton}><Text style={styles.todayText}>{locale.t('planning.today')}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>onWeekStartChange(addDays(weekStart,7))} style={styles.weekNavButton}><Text style={styles.weekNavText}>{locale.t('planning.nextWeek')} ›</Text></Pressable></View>
        {(cookingLoad.concentrated||cookingLoad.unassigned>0)?<View style={styles.loadCard}><View style={styles.loadHeader}><View style={{flex:1}}><Text style={styles.loadTitle}>{locale.t('planning.loadTitle')}</Text><Text style={styles.loadText}>{cookingLoad.concentrated&&cookingLoad.leader?locale.t('planning.loadConcentrated',{name:cookingLoad.leader.name,count:cookingLoad.leader.count,total:cookingLoad.assigned}):locale.t('planning.loadShared',{count:cookingLoad.active})}</Text></View></View><View style={styles.loadChips}>{cookingLoad.rows.filter(row=>row.count>0).map(row=><View key={row.id} style={styles.loadChip}><Text style={styles.loadChipName}>{row.name}</Text><Text style={styles.loadChipCount}>{row.count}</Text></View>)}{cookingLoad.unassigned>0?<View style={[styles.loadChip,styles.loadChipUnassigned]}><Text style={styles.loadChipName}>{locale.t('planning.loadUnassigned')}</Text><Text style={styles.loadChipCount}>{cookingLoad.unassigned}</Text></View>:null}</View></View>:null}
        {loading?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={{marginTop:30}}/>:days.map(day=>{
          const date=localIsoDate(day);return <View key={date} style={styles.dayCard}><View style={styles.dayHeader}><Text style={styles.dayName}>{locale.formatDate(day,{weekday:'long'})}</Text><Text style={styles.dayDate}>{day.getDate()}</Text></View>{mealTypes.map(mt=>{const meal=meals.find(m=>m.meal_date===date&&m.meal_type===mt.key);const cook=memberName(meal?.cook_user_id);return <Pressable accessibilityRole="button" key={mt.key} onPress={()=>openEditor(date,mt.key)} style={styles.slot}><MealGlyph type={mt.key} size={34}/><View style={{flex:1}}><Text style={styles.slotLabel}>{locale.t(mt.labelKey)}</Text><Text style={[styles.slotTitle,!meal&&styles.empty]}>{meal?(meal.meal_mode==='leftover'?`${locale.t('planning.leftoverBadge')} · ${meal.title}`:meal.title):locale.t('planning.addMeal')}</Text>{meal?<Text style={styles.slotMeta}>{[cook?locale.t('planning.cookShort',{name:cook}):'',locale.t('planning.peopleShort',{count:(meal.participant_user_ids?.length??availableMemberIds(date,mt.key).length)+(meal.guests?.length??0)}),locale.t('planning.portionsShort',{count:Math.round(meal.servings??((meal.participant_user_ids?.length??availableMemberIds(date,mt.key).length)+(meal.guests?.length??0)))})].filter(Boolean).join(' · ')}</Text>:null}</View><Text style={styles.chevron}>›</Text></Pressable>})}</View>
        })}
        <View style={styles.weekActions}><Pressable accessibilityRole="button" onPress={reusePreviousWeek} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{locale.t('planning.reuse')}</Text></Pressable><Pressable accessibilityRole="button" onPress={regenerate} style={styles.generate}><Text style={styles.generateText}>{locale.t('planning.refreshShopping')}</Text></Pressable></View>
      </View>:null}
      {message?<Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>:null}
    </ScrollView>

    <Modal visible={presenceOpen} animationType="slide" onRequestClose={()=>setPresenceOpen(false)}><PresenceScreen householdId={householdId} members={members} demo={demo} onFamilyRequired={async()=>{await handlePremiumRefusal(new Error('FAMILY_PLAN_REQUIRED'));}} onClose={()=>{setPresenceOpen(false);void loadAbsences();}}/></Modal>
    <Modal visible={ideasOpen} animationType="slide" onRequestClose={()=>setIdeasOpen(false)}><ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled"><View style={styles.modalHeader}><View style={{flex:1}}><Text style={styles.modalTitle}>{locale.t('planning.decide')}</Text><Text style={styles.modalSub}>{locale.t('planning.decideSubtitle')}</Text></View><Text accessibilityRole="button" onPress={()=>setIdeasOpen(false)} style={styles.close}>{locale.t('common.close')}</Text></View><Text style={styles.section}>{locale.t('planning.proposeIdea')}</Text><TextInput accessibilityLabel={locale.t('planning.proposeIdea')} value={ideaTitle} onChangeText={(v)=>{setIdeaTitle(v);if(v)setIdeaRecipeId(null)}} placeholder={locale.t('planning.ideaPlaceholder')} placeholderTextColor={colors.placeholder} style={styles.input}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideaPicks}>{recipes.slice(0,8).map(r=><Pressable accessibilityRole="button" accessibilityState={{selected:ideaRecipeId===r.id}} key={r.id} onPress={()=>{setIdeaRecipeId(r.id);setIdeaTitle('')}} style={[styles.ideaPick,ideaRecipeId===r.id&&styles.ideaPickActive]}><Text style={[styles.ideaPickTitle,ideaRecipeId===r.id&&styles.ideaPickTitleActive]}>{r.title}</Text></Pressable>)}</ScrollView><Pressable accessibilityRole="button" onPress={addIdea} disabled={ideaBusy||(!ideaTitle.trim()&&!ideaRecipeId)} accessibilityState={{disabled:ideaBusy||(!ideaTitle.trim()&&!ideaRecipeId)}} style={[styles.save,(ideaBusy||(!ideaTitle.trim()&&!ideaRecipeId))&&{opacity:.4}]}><Text style={styles.saveText}>{locale.t(ideaBusy?'planning.adding':'planning.proposeFamily')}</Text></Pressable>{ideaError?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.ideaError}>{ideaError}</Text>:null}<Text style={styles.section}>{locale.t('planning.familyVotes')}</Text>{ideas.map(idea=><View key={idea.id} style={styles.ideaRow}><View style={{flex:1}}><Text style={styles.ideaRowTitle}>{idea.title}</Text><Text style={styles.ideaRowMeta}>{idea.proposer_name?`${locale.t('planning.proposedBy',{name:idea.proposer_name})} · `:''}{locale.t(idea.vote_count===1?'planning.voteOne':'planning.voteMany',{count:idea.vote_count})}</Text></View><Pressable accessibilityRole="button" accessibilityState={{selected:idea.voted_by_me}} onPress={()=>voteIdea(idea)} style={[styles.voteButton,idea.voted_by_me&&styles.voteButtonActive]}><Text style={[styles.voteText,idea.voted_by_me&&styles.voteTextActive]}>{locale.t(idea.voted_by_me?'planning.voted':'planning.vote')}</Text></Pressable></View>)}{!ideas.length?<Text style={styles.emptyIdeas}>{locale.t('planning.noIdeas')}</Text>:null}</ScrollView></Modal>
    <Modal visible={Boolean(lightContext)} animationType="slide" onRequestClose={()=>setLightContext(null)}>{lightContext?<LightParticipationScreen householdId={householdId} householdName={householdName} organizerName={memberName(myUserId)??''} mealDate={lightContext.date} mealType={lightContext.type} demo={demo} onClose={()=>setLightContext(null)} onFamilyRequired={()=>{setLightContext(null);void handlePremiumRefusal(new Error('FAMILY_PLAN_REQUIRED'));}}/>:null}</Modal>
    <Modal visible={paywallOpen} animationType="slide" onRequestClose={()=>setPaywallOpen(false)}><PaywallScreen access={access} demo={demo} onClose={()=>setPaywallOpen(false)} onStartTrial={!demo&&access.plan==='free'&&onStartTrial?async()=>{await onStartTrial();setPaywallOpen(false);}:undefined}/></Modal>

    <Modal visible={Boolean(editing)} animationType="slide" onRequestClose={close}>
      <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{locale.t('planning.planMeal')}</Text>{editing?<Text style={styles.modalSub}>{editing.date} · {locale.t(mealTypes.find(x=>x.key===editing.type)?.labelKey??'meal.dinner')}</Text>:null}</View><Text accessibilityRole="button" onPress={close} style={styles.close}>{locale.t('common.close')}</Text></View>
        {lightOrganizer&&editing&&editing.date>=todayIso?<Pressable accessibilityRole="button" onPress={openLightParticipation} style={styles.familyQuestion}><View style={{flex:1}}><Text style={styles.familyQuestionTitle}>{locale.t('planning.askFamily')}</Text><Text style={styles.familyQuestionHint}>{locale.t('planning.askFamilyHint')}</Text></View><Text style={styles.familyQuestionArrow}>›</Text></Pressable>:null}
        <Text style={styles.section}>{locale.t('planning.mealMode')}</Text>
        <View style={styles.modeRow}>
          <Pressable accessibilityRole="button" accessibilityState={{selected:mealMode==='fresh'}} onPress={()=>{setMealMode('fresh');setLeftoverFromMealId(null)}} style={[styles.modeChoice,mealMode==='fresh'&&styles.modeChoiceActive]}><Text style={[styles.modeChoiceText,mealMode==='fresh'&&styles.modeChoiceTextActive]}>{locale.t('planning.freshMeal')}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{selected:mealMode==='leftover'}} onPress={()=>{setMealMode('leftover');setSelectedRecipe(null);setCustom('')}} style={[styles.modeChoice,mealMode==='leftover'&&styles.modeChoiceActive]}><Text style={[styles.modeChoiceText,mealMode==='leftover'&&styles.modeChoiceTextActive]}>{locale.t('planning.leftovers')}</Text></Pressable>
        </View>
        {mealMode==='leftover'?<>
          <Text style={styles.leftoverHint}>{locale.t('planning.leftoversHint')}</Text>
          <Text style={styles.section}>{locale.t('planning.chooseLeftoverSource')}</Text>
          {leftoverSources.length?leftoverSources.map(source=><Pressable accessibilityRole="button" accessibilityState={{selected:leftoverFromMealId===source.id}} key={source.id} onPress={()=>{setLeftoverFromMealId(source.id);setServings(Math.max(1,Math.round(source.servings??servings)))}} style={[styles.recipeChoice,leftoverFromMealId===source.id&&styles.recipeSelected]}><View style={{flex:1}}><Text style={styles.recipeChoiceText}>{source.title}</Text><Text style={styles.recipeMeta}>{locale.formatDate(new Date(`${source.meal_date}T12:00:00`),{weekday:'short',day:'numeric',month:'short'})}</Text></View><Text>{leftoverFromMealId===source.id?'✓':''}</Text></Pressable>):<Text style={styles.leftoverEmpty}>{locale.t('planning.leftoverNoSource')}</Text>}
          <View style={styles.leftoverShopping}><Text style={styles.leftoverShoppingText}>{locale.t('planning.leftoverShoppingHint')}</Text></View>
        </>:<>
          <Text style={styles.quickPlanHint}>{locale.t('planning.quickPlanHint')}</Text>
          <TextInput accessibilityLabel={locale.t('planning.writeMeal')} value={custom} onChangeText={(v)=>{setCustom(v);if(v)setSelectedRecipe(null)}} placeholder={locale.t('planning.mealPlaceholder')} placeholderTextColor={colors.placeholder} style={styles.input}/>
          <Text style={styles.section}>{locale.t('planning.chooseRecipe')}</Text>
          {recipes.map(r=>{const taste=tasteByRecipe[r.id];return <Pressable accessibilityRole="button" accessibilityState={{selected:selectedRecipe===r.id}} key={r.id} onPress={()=>{setSelectedRecipe(r.id);setCustom('')}} style={[styles.recipeChoice,selectedRecipe===r.id&&styles.recipeSelected]}><Text style={styles.recipeChoiceText}>{r.title}</Text><Text style={styles.recipeMeta}>{r.prep_minutes+r.cook_minutes} min{taste?.total?` · ${locale.t('taste.summary',{again:taste.again,ok:taste.ok,skip:taste.skip})}`:''}</Text></Pressable>})}
          {familyAccess&&ideas.length?<><Text style={styles.section}>{locale.t('planning.familyIdeas')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideaPicks}>{ideas.slice(0,5).map(idea=><Pressable accessibilityRole="button" key={idea.id} onPress={()=>useIdea(idea)} style={styles.ideaPick}><Text style={styles.ideaPickTitle}>{idea.title}</Text><Text style={styles.ideaPickVotes}>♥ {idea.vote_count}</Text></Pressable>)}</ScrollView></>:null}
        </>}

        {conflicts.length?<View style={styles.warning}><Text style={styles.warningTitle}>{locale.t('planning.warning')}</Text>{conflicts.map((c,i)=><Text key={`${c.member}-${c.reason}-${i}`} style={styles.warningText}>• {c.member} : {c.reason}</Text>)}</View>:null}

        <Pressable accessibilityRole="button" accessibilityState={{expanded:mealDetailsOpen}} onPress={()=>setMealDetailsOpen(value=>!value)} style={styles.mealDetailsToggle}>
          <View style={{flex:1}}><Text style={[styles.mealDetailsTitle,rtl&&styles.rtl]}>{locale.t('planning.mealDetails')}</Text><Text style={[styles.mealDetailsSummary,rtl&&styles.rtl]}>{mealDetailsSummary}</Text></View>
          <Text style={styles.mealDetailsArrow}>{mealDetailsOpen?'⌃':'⌄'}</Text>
        </Pressable>

        {mealDetailsOpen?<View style={styles.mealDetailsPanel}>
          <Text style={styles.section}>{locale.t('planning.whoCooks')}</Text>
          <View style={styles.chips}>{members.map(m=>{const away=editing?isAway(m.user_id,editing.date,editing.type):false;const active=cookUserId===m.user_id;return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} key={m.user_id} onPress={()=>setCookUserId(active?null:m.user_id)} style={[styles.chip,away&&styles.chipAway,active&&styles.chipActive]}><Text style={[styles.chipText,away&&styles.chipAwayText,active&&styles.chipTextActive]}>{m.display_name}{away?` · ${locale.t('planning.away')}`:''}</Text></Pressable>})}</View>

          <Text style={styles.section}>{locale.t('planning.whoEats')}</Text>
          <View style={styles.chips}>{members.map(m=>{const active=participantIds.includes(m.user_id);const away=editing?isAway(m.user_id,editing.date,editing.type):false;return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} key={m.user_id} onPress={()=>toggleParticipant(m.user_id)} style={[styles.chip,away&&!active&&styles.chipAway,active&&styles.chipActive]}><Text style={[styles.chipText,away&&!active&&styles.chipAwayText,active&&styles.chipTextActive]}>{active?'✓ ':''}{m.display_name}{away?` · ${locale.t('planning.away')}`:''}</Text></Pressable>})}</View>
          {awaySelected.length||cookAway?<View style={styles.awayWarning}><Text style={styles.awayWarningText}>{locale.t('planning.awayIncluded')}</Text></View>:null}

          <Text style={styles.guestLabel}>{locale.t('planning.guests')}</Text>
          <View style={styles.guestEntry}><TextInput accessibilityLabel={locale.t('planning.guests')} value={guestDraft} onChangeText={setGuestDraft} onSubmitEditing={addGuest} returnKeyType="done" placeholder={locale.t('planning.guestPlaceholder')} placeholderTextColor={colors.placeholder} style={styles.guestInput}/><Pressable accessibilityRole="button" onPress={addGuest} style={styles.guestAdd}><Text style={styles.guestAddText}>{locale.t('planning.addGuest')}</Text></Pressable></View>
          {guests.length?<View style={styles.chips}>{guests.map((guest,index)=><Pressable accessibilityRole="button" key={`${guest.name}-${index}`} onPress={()=>removeGuest(index)} style={[styles.chip,styles.guestChip]}><Text style={styles.chipText}>{guest.name} ×</Text></Pressable>)}</View>:<Text style={styles.guestHint}>{locale.t('planning.guestHint')}</Text>}

          <Text style={styles.section}>{locale.t('planning.servings')}</Text>
          <View style={styles.servingsRow}><Pressable accessibilityRole="button" accessibilityLabel={locale.t('planning.decreaseServings')} onPress={()=>setServings(v=>Math.max(1,v-1))} style={styles.servingButton}><Text style={styles.servingButtonText}>−</Text></Pressable><View style={styles.servingValue}><Text style={styles.servingNumber}>{servings}</Text><Text style={styles.servingLabel}>{locale.t(servings===1?'planning.servingOne':'planning.servingMany')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={locale.t('planning.increaseServings')} onPress={()=>setServings(v=>Math.min(20,v+1))} style={styles.servingButton}><Text style={styles.servingButtonText}>＋</Text></Pressable></View>
          {effectiveRecipe?<Text style={styles.servingHint}>{locale.t('planning.recipeBase',{count:effectiveRecipe.portions})}</Text>:<Text style={styles.servingHint}>{locale.t('planning.freeMealServings')}</Text>}

          <Text style={styles.section}>{locale.t('planning.note')}</Text>
          <TextInput accessibilityLabel={locale.t('planning.note')} value={notes} onChangeText={setNotes} placeholder={locale.t('planning.notePlaceholder')} placeholderTextColor={colors.placeholder} multiline style={[styles.input,{minHeight:88,textAlignVertical:'top',paddingTop:12}]}/>
        </View>:null}

        <Pressable accessibilityRole="button" onPress={save} disabled={saving||(mealMode==='leftover'?!leftoverFromMealId:(!selectedRecipe&&!custom.trim()))} accessibilityState={{disabled:saving||(mealMode==='leftover'?!leftoverFromMealId:(!selectedRecipe&&!custom.trim())),busy:saving}} style={[styles.save,(saving||(mealMode==='leftover'?!leftoverFromMealId:(!selectedRecipe&&!custom.trim())))&&{opacity:.4}]}><Text style={styles.saveText}>{saving?locale.t('planning.saving'):locale.t('common.save')}</Text></Pressable>
        {currentEditingMeal?<Pressable accessibilityRole="button" onPress={remove} style={styles.remove}><Text style={styles.removeText}>{locale.t('planning.deleteMeal')}</Text></Pressable>:null}
      </ScrollView>
    </Modal>
  </>;
}

const styles=StyleSheet.create({
  homeHeader:{flexDirection:'row',alignItems:'center',marginTop:4,marginBottom:17},householdPill:{alignSelf:'flex-start',maxWidth:'82%',minHeight:28,borderRadius:999,backgroundColor:colors.sageSoft,paddingHorizontal:10,paddingVertical:6,flexDirection:'row',alignItems:'center',gap:7},householdDot:{width:7,height:7,borderRadius:4,backgroundColor:colors.orange},householdName:{flexShrink:1,color:colors.sageDark,fontSize:10,fontWeight:'900'},homeTitle:{color:colors.ink,fontSize:38,lineHeight:42,fontWeight:'900',letterSpacing:-1.1,marginTop:10},homeDate:{color:colors.muted,fontSize:12,fontWeight:'700',marginTop:3,textTransform:'capitalize'},
  focusCard:{position:'relative',overflow:'hidden',backgroundColor:colors.sageDark,borderRadius:30,padding:21,minHeight:224,justifyContent:'flex-end',shadowColor:'#000000',shadowOpacity:.12,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:5},focusGlowA:{position:'absolute',width:210,height:210,borderRadius:105,backgroundColor:colors.sage,opacity:.24,top:-105,right:-55},focusGlowB:{position:'absolute',width:155,height:155,borderRadius:78,backgroundColor:colors.orange,opacity:.18,bottom:-80,left:-52},focusTop:{position:'absolute',top:18,left:20,right:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},focusMealBadge:{minHeight:30,borderRadius:999,backgroundColor:'rgba(255,255,255,0.14)',paddingHorizontal:12,alignItems:'center',justifyContent:'center'},focusMealBadgeText:{color:colors.onAccent,fontSize:10,fontWeight:'900'},focusLabel:{color:colors.onAccentMuted,fontSize:10,fontWeight:'900',letterSpacing:.8,textTransform:'uppercase'},focusTitle:{color:colors.onAccent,fontSize:31,lineHeight:36,fontWeight:'900',letterSpacing:-.5,maxWidth:'92%'},focusMeta:{color:colors.onAccentMuted,fontSize:11,fontWeight:'700',marginTop:9},focusHint:{color:colors.onAccentMuted,fontSize:12,lineHeight:18,marginTop:9,maxWidth:'90%'},focusActions:{flexDirection:'row',gap:9,marginTop:17},focusPrimary:{minHeight:43,paddingHorizontal:17,borderRadius:14,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center'},focusPrimaryText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},focusSecondary:{minHeight:43,paddingHorizontal:15,borderRadius:14,borderWidth:1,borderColor:'rgba(255,255,255,0.34)',alignItems:'center',justifyContent:'center'},focusSecondaryText:{color:colors.onAccent,fontSize:11,fontWeight:'900'},
  quickRow:{flexDirection:'row',gap:9,marginTop:12},quickCard:{flex:1,minHeight:76,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:18,paddingHorizontal:12,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:9},quickDot:{width:10,height:10,borderRadius:5,backgroundColor:colors.sage},quickDotWarm:{backgroundColor:colors.orange},quickTitle:{color:colors.ink,fontSize:11,fontWeight:'900'},quickMeta:{color:colors.muted,fontSize:9,lineHeight:13,marginTop:3},quickArrow:{color:colors.sageDark,fontSize:19,fontWeight:'700'},
  todayCompact:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:22,overflow:'hidden',marginTop:12},sectionTitle:{color:colors.muted,fontSize:10,fontWeight:'900',letterSpacing:.8,textTransform:'uppercase',paddingHorizontal:14,paddingTop:14,paddingBottom:8},compactMeal:{minHeight:61,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:13,paddingVertical:9},compactBorder:{borderTopWidth:1,borderTopColor:colors.border},compactLabel:{color:colors.muted,fontSize:8,fontWeight:'900',textTransform:'uppercase'},compactTitle:{color:colors.ink,fontSize:12,fontWeight:'900',marginTop:2},todayMealEmpty:{color:colors.placeholder},compactMeta:{color:colors.muted,fontSize:8,marginTop:3},
  weekToggle:{minHeight:62,borderTopWidth:1,borderTopColor:colors.border,paddingHorizontal:4,paddingTop:17,paddingBottom:5,marginTop:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},weekToggleTitle:{color:colors.ink,fontSize:13,fontWeight:'900'},weekToggleMeta:{color:colors.muted,fontSize:10,marginTop:4,textTransform:'capitalize'},weekToggleArrow:{color:colors.sageDark,fontSize:20,fontWeight:'900'},weekSection:{marginTop:2},
  content:{padding:20,paddingBottom:28},weekNav:{flexDirection:'row',gap:7,marginTop:12,alignItems:'center'},weekNavButton:{flex:1,minHeight:38,borderWidth:1,borderColor:colors.border,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:6},weekNavText:{fontSize:10,color:colors.ink,fontWeight:'700',textAlign:'center'},todayButton:{minHeight:38,paddingHorizontal:10,borderRadius:12,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},todayText:{fontSize:10,color:colors.sageDark,fontWeight:'800'},loadCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,marginTop:10},loadHeader:{flexDirection:'row',alignItems:'flex-start',gap:12},loadTitle:{color:colors.ink,fontSize:13,fontWeight:'900'},loadText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:4},loadChips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:11},loadChip:{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:colors.sageSoft,borderRadius:999,paddingHorizontal:10,paddingVertical:7},loadChipUnassigned:{backgroundColor:colors.neutralSoft},loadChipName:{color:colors.ink,fontSize:10,fontWeight:'800'},loadChipCount:{color:colors.sageDark,fontSize:11,fontWeight:'900'},
  dayCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,overflow:'hidden',marginTop:12},dayHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:14,paddingVertical:10,backgroundColor:colors.input},dayName:{color:colors.sageDark,fontWeight:'900',textTransform:'capitalize'},dayDate:{color:colors.orange,fontWeight:'900'},slot:{flexDirection:'row',alignItems:'center',minHeight:66,paddingHorizontal:13,borderTopWidth:1,borderTopColor:colors.border},slotLabel:{color:colors.muted,fontSize:10,fontWeight:'800'},slotTitle:{color:colors.ink,fontSize:14,fontWeight:'800',marginTop:3},slotMeta:{color:colors.muted,fontSize:10,marginTop:4},empty:{color:colors.placeholder},chevron:{fontSize:26,color:colors.iconMuted},weekActions:{gap:9,marginTop:16},secondaryAction:{minHeight:48,borderRadius:radius.md,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},secondaryActionText:{color:colors.sageDark,fontWeight:'800',fontSize:12},generate:{minHeight:50,borderRadius:radius.md,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},generateText:{color:colors.sageDark,fontWeight:'800'},message:{textAlign:'center',color:colors.orange,fontSize:12,fontWeight:'700',marginTop:10},
  familyQuestion:{minHeight:70,borderRadius:18,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.sageBorder,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:10,marginBottom:4},familyQuestionTitle:{color:colors.sageDark,fontSize:13,fontWeight:'900'},familyQuestionHint:{color:colors.muted,fontSize:10,lineHeight:15,marginTop:3},familyQuestionArrow:{color:colors.sageDark,fontSize:24,fontWeight:'900'},
  modalContent:{padding:22,paddingTop:60,paddingBottom:50,backgroundColor:colors.cream,minHeight:'100%'},modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18},modalTitle:{fontSize:28,fontWeight:'800',color:colors.ink},modalSub:{color:colors.muted,marginTop:5},close:{color:colors.sageDark,fontWeight:'800',paddingTop:8},section:{color:colors.muted,fontSize:11,letterSpacing:1.1,fontWeight:'900',marginTop:18,marginBottom:8},recipeChoice:{minHeight:52,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:14,paddingHorizontal:14,marginTop:7,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},recipeSelected:{borderColor:colors.sageDark,backgroundColor:colors.sageSoft},recipeChoiceText:{color:colors.ink,fontWeight:'700',flex:1},recipeMeta:{color:colors.muted,fontSize:11},ideaPicks:{gap:8,paddingRight:12,marginBottom:5},ideaPick:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper,borderRadius:999,paddingHorizontal:12,paddingVertical:9},ideaPickActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},ideaPickTitle:{color:colors.ink,fontSize:11,fontWeight:'800',maxWidth:170},ideaPickTitleActive:{color:colors.onAccent},ideaPickVotes:{color:colors.orange,fontSize:9,fontWeight:'900',marginTop:2},ideaRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:13,marginTop:8},ideaRowTitle:{color:colors.ink,fontSize:14,fontWeight:'900'},ideaRowMeta:{color:colors.muted,fontSize:10,marginTop:3},voteButton:{borderWidth:1,borderColor:colors.warningBorder,borderRadius:999,paddingHorizontal:11,paddingVertical:8},voteButtonActive:{backgroundColor:colors.orangeSoft,borderColor:colors.warningBorder},voteText:{color:colors.muted,fontWeight:'800',fontSize:10},voteTextActive:{color:colors.orange},ideaError:{color:colors.error,fontSize:11,marginTop:10},emptyIdeas:{color:colors.muted,fontSize:12,textAlign:'center',marginTop:15},input:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:15,minHeight:50,paddingHorizontal:14,color:colors.ink},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderColor:colors.border,borderRadius:999,paddingHorizontal:13,paddingVertical:9,backgroundColor:colors.paper},chipActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},chipText:{color:colors.ink,fontSize:12,fontWeight:'700'},chipTextActive:{color:colors.onAccent},chipAway:{backgroundColor:colors.neutralSoft,borderColor:colors.border},chipAwayText:{color:colors.muted},awayWarning:{backgroundColor:colors.orangeSoft,borderRadius:12,padding:10,marginTop:9},awayWarningText:{color:colors.warningText,fontSize:10,lineHeight:15,fontWeight:'700'},quickPlanHint:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:12,marginBottom:8},mealDetailsToggle:{minHeight:62,marginTop:16,paddingHorizontal:14,paddingVertical:11,borderRadius:15,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper,flexDirection:'row',alignItems:'center',gap:10},mealDetailsTitle:{color:colors.ink,fontSize:12,fontWeight:'900'},mealDetailsSummary:{color:colors.muted,fontSize:10,lineHeight:15,marginTop:3},mealDetailsArrow:{color:colors.sageDark,fontSize:20,fontWeight:'900'},mealDetailsPanel:{paddingTop:2},modeRow:{flexDirection:'row',gap:8},modeChoice:{flex:1,minHeight:46,borderWidth:1,borderColor:colors.border,borderRadius:14,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center',paddingHorizontal:8},modeChoiceActive:{backgroundColor:colors.sageDark,borderColor:colors.sageDark},modeChoiceText:{color:colors.ink,fontSize:11,fontWeight:'800'},modeChoiceTextActive:{color:colors.onAccent},leftoverHint:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:8},leftoverEmpty:{color:colors.muted,fontSize:12,lineHeight:18,paddingVertical:10},leftoverShopping:{backgroundColor:colors.sageSoft,borderRadius:13,padding:12,marginTop:10},leftoverShoppingText:{color:colors.sageDark,fontSize:11,fontWeight:'700',lineHeight:16},guestLabel:{color:colors.muted,fontSize:10,fontWeight:'800',marginTop:10,marginBottom:6},guestEntry:{flexDirection:'row',gap:8,alignItems:'center'},guestInput:{flex:1,minHeight:44,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:13,paddingHorizontal:12,color:colors.ink},guestAdd:{minHeight:44,paddingHorizontal:13,borderRadius:13,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},guestAddText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},guestChip:{backgroundColor:colors.neutralSoft},guestHint:{color:colors.muted,fontSize:10,lineHeight:15,marginTop:4},warning:{backgroundColor:colors.orangeSoft,borderRadius:14,padding:13,marginTop:12},warningTitle:{color:colors.warningText,fontWeight:'900',fontSize:13},warningText:{color:colors.warningText,fontSize:12,marginTop:5},ok:{backgroundColor:colors.sageSoft,borderRadius:14,padding:12,marginTop:12},okText:{color:colors.sageDark,fontSize:12,fontWeight:'700'},servingsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:14,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:10},servingButton:{width:48,height:48,borderRadius:14,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},servingButtonText:{color:colors.sageDark,fontSize:25,fontWeight:'800'},servingValue:{minWidth:90,alignItems:'center'},servingNumber:{color:colors.ink,fontSize:26,fontWeight:'900'},servingLabel:{color:colors.muted,fontSize:10,fontWeight:'700'},servingHint:{color:colors.muted,fontSize:10,lineHeight:15,textAlign:'center',marginTop:7},save:{backgroundColor:colors.sageDark,minHeight:54,borderRadius:16,alignItems:'center',justifyContent:'center',marginTop:22},saveText:{color:colors.onAccent,fontWeight:'800',fontSize:16},remove:{minHeight:48,alignItems:'center',justifyContent:'center',marginTop:10},removeText:{color:colors.error,fontWeight:'800'},rtl:{textAlign:'right',writingDirection:'rtl'}
});
