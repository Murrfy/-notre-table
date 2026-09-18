import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, radius } from '../theme';
import { Recipe } from '../types';
import { useLocale } from '../context/LocaleContext';
import { convertQuantity } from '../lib/units';
import { normalizeUnit } from '../domain/catalog';
import {formatCookingClock,liaCookingApproximationConsent,liaCookingCue,liaCookingIngredientMatches} from '../lib/liaCookingCompanion';
import {runLiaCookingCommand,type LiaCookingSpeechAdapter} from '../services/liaCookingRuntime';
import {setLiaCookingSessionVoiceHandler,type LiaCookingApproximationRequest} from '../services/liaCookingSession';

export function CookingModeScreen({recipe,onClose,speechAdapter}:{recipe:Recipe;onClose:()=>void;speechAdapter?:LiaCookingSpeechAdapter}){
  useKeepAwake('notre-table-cooking');
  const locale=useLocale(); const rtl=locale.textDirection==='rtl';
  const steps=useMemo(()=>recipe.steps?.filter(Boolean)??[],[recipe.steps]);
  const [index,setIndex]=useState(0);
  const [ingredientsOpen,setIngredientsOpen]=useState(false);
  const [timerEndsAt,setTimerEndsAt]=useState<number|null>(null);
  const [clockNow,setClockNow]=useState(()=>Date.now());
  const [voiceListening,setVoiceListening]=useState(false);
  const approximationPendingRef=useRef<LiaCookingApproximationRequest|null>(null);
  const current=steps[index]??locale.t('cooking.noStep');
  const cue=useMemo(()=>liaCookingCue(current,index,steps.length),[current,index,steps.length]);
  const remainingSeconds=timerEndsAt===null?0:Math.max(0,Math.ceil((timerEndsAt-clockNow)/1000));
  useEffect(()=>{if(timerEndsAt===null)return;const id=setInterval(()=>setClockNow(Date.now()),1000);return()=>clearInterval(id);},[timerEndsAt]);
  useEffect(()=>{if(timerEndsAt!==null&&remainingSeconds===0)setTimerEndsAt(null);},[remainingSeconds,timerEndsAt]);
  useEffect(()=>{setTimerEndsAt(null);setClockNow(Date.now());},[index]);
  const handleHandsFreeCommand=(text:string)=>{
    const now=Date.now();
    const result=runLiaCookingCommand({
      text,currentStep:current,nowMs:now,
      state:{stepIndex:index,stepCount:steps.length,timerEndsAtMs:timerEndsAt,voiceShouldStop:false},
    });
    if(result.state.stepIndex!==index)setIndex(result.state.stepIndex);
    if(result.state.timerEndsAtMs!==timerEndsAt){setClockNow(now);setTimerEndsAt(result.state.timerEndsAtMs);}
    if(result.action.kind==='show_ingredients'||result.action.kind==='list_ingredients'||result.action.kind==='scale_ingredients')setIngredientsOpen(true);
    if(result.action.kind==='hide_ingredients')setIngredientsOpen(false);
    return result;
  };
  useEffect(()=>setLiaCookingSessionVoiceHandler((text,languageTag)=>{
    const fr=languageTag.toLowerCase().startsWith('fr');
    const pendingApproximation=approximationPendingRef.current;
    if(pendingApproximation){
      const consent=liaCookingApproximationConsent(text);
      if(consent==='yes'){
        approximationPendingRef.current=null;
        return{handled:true,spokenReply:null,clarificationPending:false,approximationRequest:pendingApproximation};
      }
      if(consent==='no'){
        approximationPendingRef.current=null;
        return{handled:true,spokenReply:fr?'D’accord, je reste uniquement sur les quantités exactes de la recette.':'Okay, I’ll stick to the exact quantities in the recipe.',clarificationPending:false};
      }
      return{handled:true,spokenReply:fr?'Dis-moi simplement oui ou non : tu veux que je te fasse une approximation ?':'Just tell me yes or no: do you want me to make an approximation?',clarificationPending:true};
    }
    const result=handleHandsFreeCommand(text);
    if(result.action.kind==='unknown'||result.action.kind==='music')return{handled:false,spokenReply:null};
    if(result.action.kind==='repeat_step')return{handled:true,spokenReply:current};
    if(result.action.kind==='step_status'){
      const stepNumber=Math.min(steps.length,Math.max(1,index+1));
      if(!steps.length)return{handled:true,spokenReply:fr?'Aucune étape n’est renseignée pour cette recette.':'No steps are entered for this recipe.'};
      return{handled:true,spokenReply:fr?`Tu es à l’étape ${stepNumber} sur ${steps.length} : ${current}`:`You’re on step ${stepNumber} of ${steps.length}: ${current}`};
    }
    if(result.action.kind==='go_to_step'){
      const target=result.action.stepNumber??null;
      if(target===null||target<1||target>steps.length)return{handled:true,spokenReply:fr?`Cette recette a ${steps.length} étape${steps.length>1?'s':''}.`:`This recipe has ${steps.length} step${steps.length===1?'':'s'}.`};
      return{handled:true,spokenReply:steps[target-1]??null};
    }
    if(result.action.kind==='show_ingredients')return{handled:true,spokenReply:fr?'Je te les affiche.':'I’m showing the ingredients.'};
    if(result.action.kind==='hide_ingredients')return{handled:true,spokenReply:fr?'D’accord, je les masque.':'Okay, I’m hiding the ingredients.'};
    if(result.action.kind==='scale_ingredients'){
      const targetServings=result.action.targetServings??null;
      const ingredients=recipe.ingredients?.filter(item=>item.name.trim())??[];
      if(!ingredients.length)return{handled:true,spokenReply:fr?'Aucun ingrédient n’est renseigné pour cette recette.':'No ingredients are entered for this recipe.'};
      if(targetServings===null)return{handled:true,spokenReply:fr?'Pour combien de personnes ?':'For how many people?'};
      if(!Number.isFinite(recipe.portions)||recipe.portions<=0){
        const approximationRequest:LiaCookingApproximationRequest={
          scope:'ingredient_list',
          recipeTitle:recipe.title,
          ingredientName:ingredients.map(item=>item.name).join(', '),
          targetServings,
          baseServings:null,
          recordedQuantity:null,
          recordedUnit:null,
          ingredients:ingredients.map(item=>({name:item.name,quantity:item.quantity??null,unit:item.unit??null})),
          reason:'missing_base_servings',
        };
        approximationPendingRef.current=approximationRequest;
        return{handled:true,spokenReply:fr?'La recette ne précise pas son nombre de portions de base, donc je ne peux pas adapter toute la liste exactement. Tu veux que je te fasse une approximation ?':'The recipe does not include a base serving count, so I can’t scale the whole list exactly. Do you want me to make an approximation?',clarificationPending:true};
      }
      const exact:string[]=[];
      const missing:string[]=[];
      for(const ingredient of ingredients){
        if(ingredient.quantity==null){missing.push(ingredient.name);continue;}
        const scaledLabel=quantityLabel(ingredient.quantity*targetServings/recipe.portions,ingredient.unit);
        if(!scaledLabel){missing.push(ingredient.name);continue;}
        exact.push(`${ingredient.name}, ${scaledLabel}`);
      }
      if(!missing.length){
        return{handled:true,spokenReply:fr?`Pour ${targetServings} personnes : ${exact.join(', ')}.`:`For ${targetServings} people: ${exact.join(', ')}.`};
      }
      const approximationRequest:LiaCookingApproximationRequest={
        scope:'ingredient_list',
        recipeTitle:recipe.title,
        ingredientName:missing.join(', '),
        targetServings,
        baseServings:recipe.portions,
        recordedQuantity:null,
        recordedUnit:null,
        ingredients:ingredients.map(item=>({name:item.name,quantity:item.quantity??null,unit:item.unit??null})),
        reason:'missing_quantity',
      };
      approximationPendingRef.current=approximationRequest;
      const exactPart=exact.length?(fr?`Je peux calculer exactement : ${exact.join(', ')}. `:`I can calculate exactly: ${exact.join(', ')}. `):'';
      const missingPart=fr?`Il manque une quantité précise pour ${missing.join(', ')}. Tu veux que je fasse une approximation pour ce qui manque ?`:`There is no exact quantity for ${missing.join(', ')}. Do you want me to approximate what is missing?`;
      return{handled:true,spokenReply:`${exactPart}${missingPart}`,clarificationPending:true};
    }
    if(result.action.kind==='ingredient_quantity'){
      const query=result.action.ingredientQuery?.trim()??'';
      const matches=query?liaCookingIngredientMatches(query,recipe.ingredients??[]):[];
      if(!matches.length)return{handled:true,spokenReply:fr?`Je ne vois pas ${query||'cet ingrédient'} dans cette recette.`:`I don’t see ${query||'that ingredient'} in this recipe.`};
      if(matches.length>1)return{handled:true,spokenReply:fr?`${matches[0].name} apparaît plusieurs fois dans la recette. Je préfère ne pas additionner des quantités qui pourraient avoir des usages différents.`:`${matches[0].name} appears more than once in the recipe. I won’t add quantities that may be used differently.`};
      const ingredient=matches[0];
      const targetServings=result.action.targetServings??null;
      if(targetServings!==null&&(!Number.isFinite(recipe.portions)||recipe.portions<=0)){
        const approximationRequest:LiaCookingApproximationRequest={scope:'ingredient',recipeTitle:recipe.title,ingredientName:ingredient.name,targetServings,baseServings:null,recordedQuantity:ingredient.quantity??null,recordedUnit:ingredient.unit??null,reason:'missing_base_servings'};
        approximationPendingRef.current=approximationRequest;
        return{handled:true,spokenReply:fr?'La recette ne précise pas pour combien de personnes elle est prévue, donc je ne peux pas calculer exactement. Tu veux que je te fasse une approximation ?':'The recipe does not say how many servings it makes, so I can’t calculate it exactly. Do you want me to make an approximation?',clarificationPending:true};
      }
      if(ingredient.quantity==null){
        const approximationRequest:LiaCookingApproximationRequest={scope:'ingredient',recipeTitle:recipe.title,ingredientName:ingredient.name,targetServings,baseServings:Number.isFinite(recipe.portions)&&recipe.portions>0?recipe.portions:null,recordedQuantity:null,recordedUnit:ingredient.unit??null,reason:'missing_quantity'};
        approximationPendingRef.current=approximationRequest;
        return{handled:true,spokenReply:fr?`La recette mentionne ${ingredient.name}, mais sans quantité précise. Tu veux que je te fasse une approximation ?`:`The recipe includes ${ingredient.name}, but no exact quantity is entered. Do you want me to make an approximation?`,clarificationPending:true};
      }
      if(targetServings!==null){
        const scaledQuantity=ingredient.quantity*targetServings/recipe.portions;
        const scaledLabel=quantityLabel(scaledQuantity,ingredient.unit);
        if(!scaledLabel)return{handled:true,spokenReply:fr?`Je ne peux pas calculer une quantité précise de ${ingredient.name} pour ${targetServings} personnes.`:`I can’t calculate an exact amount of ${ingredient.name} for ${targetServings} people.`};
        return{handled:true,spokenReply:fr?`Pour ${targetServings} personnes, il faut ${scaledLabel} de ${ingredient.name}.`:`For ${targetServings} people, you need ${scaledLabel} of ${ingredient.name}.`};
      }
      const quantity=quantityLabel(ingredient.quantity,ingredient.unit);
      if(!quantity)return{handled:true,spokenReply:fr?`La recette mentionne ${ingredient.name}, mais je ne peux pas en déduire une quantité précise.`:`The recipe includes ${ingredient.name}, but I can’t derive an exact quantity.`};
      return{handled:true,spokenReply:fr?`Il faut ${quantity} de ${ingredient.name}.`:`You need ${quantity} of ${ingredient.name}.`};
    }
    if(result.action.kind==='list_ingredients'){
      const items=recipe.ingredients?.filter(x=>x.name.trim()).map(x=>{const quantity=quantityLabel(x.quantity,x.unit);return quantity?`${x.name}, ${quantity}`:x.name;})??[];
      if(!items.length)return{handled:true,spokenReply:fr?'Aucun ingrédient n’est renseigné pour cette recette.':'No ingredients are entered for this recipe.'};
      const lead=fr?'Il te faut ':'You need ';
      return{handled:true,spokenReply:`${lead}${items.join(', ')}.`};
    }
    if(result.action.kind==='timer_remaining')return{handled:true,spokenReply:result.reply.kind==='timer_remaining'?(fr?`Il reste ${result.reply.textValue}.`:`${result.reply.textValue} remaining.`):(fr?'Aucun minuteur de recette n’est en cours.':'No recipe timer is running.')};
    if(result.action.kind==='cancel_timer')return{handled:true,spokenReply:result.reply.kind==='timer_cancelled'?(fr?`D’accord, j’annule le minuteur de la recette.`:`Okay, I’m cancelling the recipe timer.`):(fr?'Aucun minuteur de recette n’est en cours.':'No recipe timer is running.')};
    if(result.action.kind==='start_timer'){
      if(result.action.timerSeconds===null)return{handled:true,spokenReply:fr?'Dis-moi combien de temps.':'Tell me how long.'};
      const seconds=result.action.timerSeconds;
      const duration=seconds%60===0?(fr?`${seconds/60} minute${seconds/60>1?'s':''}`:`${seconds/60} minute${seconds/60===60?'':'s'}`):(fr?`${Math.floor(seconds/60)?`${Math.floor(seconds/60)} min `:''}${seconds%60} sec`:`${formatCookingClock(seconds)}`);
      return{handled:true,spokenReply:fr?`D’accord, je lance ${duration}.`:`Okay, starting ${duration}.`};
    }
    if(result.action.kind==='next_step'){
      const nextIndex=Math.min(Math.max(0,steps.length-1),index+1);
      if(nextIndex===index)return{handled:true,spokenReply:fr?'C’est la dernière étape.':'This is the last step.'};
      return{handled:true,spokenReply:steps[nextIndex]??null};
    }
    if(result.action.kind==='complete_step'){
      const nextIndex=Math.min(Math.max(0,steps.length-1),index+1);
      if(nextIndex===index)return{handled:true,spokenReply:fr?'C’était la dernière étape.':'That was the last step.'};
      return{handled:true,spokenReply:steps[nextIndex]??null};
    }
    if(result.action.kind==='finish_recipe'){
      onClose();
      return{handled:true,spokenReply:fr?'C’est terminé. Bon appétit !':'All done. Enjoy your meal!'};
    }
    if(result.action.kind==='previous_step'){
      const previousIndex=Math.max(0,index-1);
      if(previousIndex===index)return{handled:true,spokenReply:fr?'C’est la première étape.':'This is the first step.'};
      return{handled:true,spokenReply:steps[previousIndex]??null};
    }
    if(result.action.kind==='stop_voice')return{handled:true,spokenReply:null};
    return{handled:false,spokenReply:null};
  },()=>{approximationPendingRef.current=null;}),[current,index,steps,timerEndsAt,recipe.ingredients,recipe.portions,recipe.title,onClose,locale]);

  const toggleVoiceListening=async()=>{
    if(!speechAdapter?.available)return;
    if(voiceListening){await speechAdapter.stop();setVoiceListening(false);return;}
    await speechAdapter.start(text=>{handleHandsFreeCommand(text);});
    setVoiceListening(true);
  };
  useEffect(()=>()=>{if(speechAdapter?.available)void speechAdapter.stop();},[speechAdapter]);
  const progress=steps.length?Math.min(100,((index+1)/steps.length)*100):0;
  const quantityLabel=(quantity:number|null|undefined,unit:string|null|undefined)=>{if(quantity==null)return'';const converted=convertQuantity(quantity,unit,locale.measurementSystem);const normalized=normalizeUnit(converted.unit);const unitLabel=normalized&&['piece','pack','ball','can','box','g','kg','ml','l','tsp','tbsp','cup','oz','lb'].includes(String(normalized))?locale.t(`unit.${normalized}${normalized==='piece'&&converted.quantity!==1?'_plural':''}` as any):String(normalized??'');return `${locale.formatNumber(converted.quantity??quantity)} ${unitLabel}`.trim();};
  return <View style={styles.screen}>
    <View style={styles.header}><View style={{flex:1}}><Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('cooking.kicker')}</Text><Text numberOfLines={2} style={[styles.title,rtl&&styles.rtl]}>{recipe.title}</Text></View><Pressable accessibilityRole="button" onPress={onClose} hitSlop={14}><Text style={styles.close}>{locale.t('common.close')}</Text></Pressable></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${progress}%`}]} /></View>
    <View style={styles.metaRow}><Text style={styles.meta}>{steps.length?locale.t('cooking.stepProgress',{current:index+1,total:steps.length}):locale.t('cooking.preparation')}</Text><Text style={styles.meta}>{locale.t('cooking.portions',{count:locale.formatNumber(recipe.portions)})}</Text></View>

    <ScrollView contentContainerStyle={styles.stepArea} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepText,rtl&&styles.rtl]}>{current}</Text>
      <View style={styles.liaCard}><Text style={[styles.liaLabel,rtl&&styles.rtl]}>{locale.t('cooking.liaWithYou')}</Text><Text style={[styles.liaText,rtl&&styles.rtl]}>{locale.t(cue.kind==='timed'?'cooking.liaTimed':cue.kind==='salt'?'cooking.liaSalt':cue.kind==='next_step'?'cooking.liaNext':'cooking.liaSteady',cue.seconds?{minutes:locale.formatNumber(Math.round(cue.seconds/60))}:undefined)}</Text>{cue.seconds?<Pressable accessibilityRole="button" onPress={()=>{setClockNow(Date.now());setTimerEndsAt(Date.now()+cue.seconds!*1000);}} accessibilityState={{selected:timerEndsAt!==null}} style={[styles.timerButton,timerEndsAt!==null&&styles.timerButtonActive]}><Text style={[styles.timerButtonText,timerEndsAt!==null&&styles.timerButtonTextActive]}>{timerEndsAt!==null?locale.t('cooking.timerRunning',{time:formatCookingClock(remainingSeconds)}):locale.t('cooking.startTimer',{minutes:locale.formatNumber(Math.round(cue.seconds/60))})}</Text></Pressable>:null}{timerEndsAt!==null?<Pressable accessibilityRole="button" onPress={()=>setTimerEndsAt(null)} style={styles.timerCancel}><Text style={styles.timerCancelText}>{locale.t('cooking.cancelTimer')}</Text></Pressable>:null}</View>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:ingredientsOpen}} onPress={()=>setIngredientsOpen(v=>!v)} style={styles.ingredientsToggle}><Text style={styles.ingredientsToggleText}>{locale.t(ingredientsOpen?'cooking.hideIngredients':'cooking.showIngredients')}</Text></Pressable>
      {ingredientsOpen?<View style={styles.ingredientsCard}><Text style={[styles.ingredientsTitle,rtl&&styles.rtl]}>{locale.t('cooking.ingredients')}</Text>{recipe.ingredients?.length?recipe.ingredients.map((x,i)=><View key={`${x.name}-${i}`} style={styles.ingredientRow}><Text style={styles.bullet}>•</Text><Text style={[styles.ingredientText,rtl&&styles.rtl]}>{x.name}{x.quantity!=null?` — ${quantityLabel(x.quantity,x.unit)}`:''}</Text></View>):<Text style={[styles.empty,rtl&&styles.rtl]}>{locale.t('cooking.noIngredients')}</Text>}</View>:null}
    </ScrollView>

    <View style={styles.footer}>
      <Pressable accessibilityRole="button" disabled={index===0} accessibilityState={{disabled:index===0}} onPress={()=>setIndex(i=>Math.max(0,i-1))} style={[styles.secondary,index===0&&styles.disabled]}><Text style={styles.secondaryText}>‹ {locale.t('cooking.previous')}</Text></Pressable>
      {steps.length&&index<steps.length-1?<Pressable accessibilityRole="button" onPress={()=>setIndex(i=>Math.min(steps.length-1,i+1))} style={styles.primary}><Text style={styles.primaryText}>{locale.t('cooking.next')} ›</Text></Pressable>:<Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}><Text style={styles.primaryText}>{locale.t('cooking.finish')} ✓</Text></Pressable>}
    </View>
    {speechAdapter?.available?<Pressable accessibilityRole="button" accessibilityState={{selected:voiceListening}} onPress={()=>{void toggleVoiceListening();}} style={styles.voiceButton}><Text style={styles.voiceButtonText}>{voiceListening?'LIA • écoute':'LIA • mains libres'}</Text></Pressable>:null}
    <Text style={[styles.keepAwake,rtl&&styles.rtl]}>{locale.t('cooking.keepAwake')}</Text>
  </View>;
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.cream,paddingHorizontal:22,paddingTop:58,paddingBottom:24},header:{flexDirection:'row',gap:14,alignItems:'flex-start'},kicker:{color:colors.orange,fontSize:10,fontWeight:'900',letterSpacing:1.4},title:{color:colors.ink,fontSize:26,lineHeight:31,fontWeight:'900',marginTop:5},close:{color:colors.sageDark,fontWeight:'900',paddingTop:5},progressTrack:{height:7,borderRadius:999,backgroundColor:colors.track,overflow:'hidden',marginTop:22},progressFill:{height:'100%',backgroundColor:colors.sageDark,borderRadius:999},metaRow:{flexDirection:'row',justifyContent:'space-between',marginTop:9},meta:{color:colors.muted,fontSize:11,fontWeight:'700'},stepArea:{flexGrow:1,justifyContent:'center',paddingVertical:28},stepText:{color:colors.ink,fontSize:30,lineHeight:42,fontWeight:'800'},liaCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,marginTop:20},liaLabel:{color:colors.orange,fontSize:10,fontWeight:'900',letterSpacing:1},liaText:{color:colors.ink,fontSize:13,lineHeight:19,fontWeight:'700',marginTop:5},timerButton:{marginTop:12,minHeight:44,borderRadius:13,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center',paddingHorizontal:12},timerButtonActive:{backgroundColor:colors.sageDark},timerButtonText:{color:colors.sageDark,fontSize:12,fontWeight:'900'},timerButtonTextActive:{color:colors.onAccent},timerCancel:{alignSelf:'center',paddingHorizontal:12,paddingVertical:8,marginTop:4},timerCancelText:{color:colors.muted,fontSize:10,fontWeight:'800'},ingredientsToggle:{alignSelf:'flex-start',marginTop:28,backgroundColor:colors.sageSoft,paddingHorizontal:13,paddingVertical:10,borderRadius:999},ingredientsToggleText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},ingredientsCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:16,marginTop:13},ingredientsTitle:{color:colors.muted,fontSize:10,fontWeight:'900',letterSpacing:1.1,marginBottom:7},ingredientRow:{flexDirection:'row',gap:8,paddingVertical:5},bullet:{color:colors.orange,fontWeight:'900'},ingredientText:{color:colors.ink,fontSize:13,flex:1},empty:{color:colors.muted,fontSize:12},footer:{flexDirection:'row',gap:10},secondary:{flex:1,minHeight:54,borderWidth:1,borderColor:colors.border,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.paper},disabled:{opacity:.35},secondaryText:{color:colors.sageDark,fontWeight:'900'},primary:{flex:1.35,minHeight:54,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.sageDark},primaryText:{color:colors.onAccent,fontWeight:'900'},voiceButton:{alignSelf:'center',marginTop:10,minHeight:42,paddingHorizontal:18,borderRadius:999,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},voiceButtonText:{color:colors.sageDark,fontSize:11,fontWeight:'900'},keepAwake:{color:colors.muted,fontSize:9,textAlign:'center',marginTop:9},rtl:{textAlign:'right',writingDirection:'rtl'}});
