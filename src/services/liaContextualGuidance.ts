import {isRecord,readStoredJson,writeStoredJson} from '../lib/storage';
import type {MealType} from '../types';
import type {LightDesire,LightHomeStyle} from './lightParticipation';

export type LiaAppFeature='planning'|'shopping'|'recipes'|'household'|'commander'|'memos';
export type LiaAppFeatureHelpStep='choose_meal'|'add_item'|'confirm_item'|'write_memo'|'complete_memo'|'choose_location'|'set_address';

export type LiaContextualGuidanceEvent=
  |{kind:'app_feature_first_use';householdId:string;organizerName:string;feature:LiaAppFeature}
  |{kind:'app_feature_help';householdId:string;organizerName:string;feature:LiaAppFeature;step:LiaAppFeatureHelpStep}
  |{kind:'family_message_first_use';householdId:string;organizerName:string}
  |{kind:'family_message_help';householdId:string;organizerName:string;step:'prepare'|'share'}
  |{kind:'family_choice_changed';householdId:string;organizerName:string;memberName:string;mealDate:string;mealType:MealType;questionId:string;desire:LightDesire;homeStyle:LightHomeStyle|null}
  |{kind:'family_take_charge_changed';householdId:string;organizerName:string;memberName:string;mealDate:string;mealType:MealType;active:boolean}
  |{kind:'profile_enrichment_question';householdId:string;organizerName:string;subjectName:string;fact:'birthday'|'favorite_meal'}
  |{kind:'birthday_awareness';householdId:string;organizerName:string;subjectName:string;daysUntil:number;favoriteMeal:string|null};

type Listener=(event:LiaContextualGuidanceEvent)=>void;
const listeners=new Set<Listener>();
const pending:LiaContextualGuidanceEvent[]=[];
const recentEventAt=new Map<string,number>();
const SEEN_KEY='@notre-table/lia-contextual-guidance-seen-v1';

function cleanName(value:string):string{return value.trim().replace(/\s+/g,' ').slice(0,80);}
function validSeen(value:unknown):value is Record<string,boolean>{
  return isRecord(value)&&Object.values(value).every(item=>typeof item==='boolean');
}

function eventKey(event:LiaContextualGuidanceEvent):string{
  if(event.kind==='app_feature_first_use')return event.kind+':'+event.householdId+':'+event.feature;
  if(event.kind==='app_feature_help')return event.kind+':'+event.householdId+':'+event.feature+':'+event.step;
  if(event.kind==='family_message_first_use')return event.kind+':'+event.householdId+':'+event.organizerName;
  if(event.kind==='family_message_help')return event.kind+':'+event.householdId+':'+event.step;
  if(event.kind==='family_choice_changed')return event.kind+':'+event.householdId+':'+event.mealDate+':'+event.mealType+':'+event.memberName+':'+event.desire;
  if(event.kind==='family_take_charge_changed')return event.kind+':'+event.householdId+':'+event.mealDate+':'+event.mealType+':'+event.memberName+':'+String(event.active);
  if(event.kind==='profile_enrichment_question')return event.kind+':'+event.householdId+':'+event.subjectName+':'+event.fact;
  return event.kind+':'+event.householdId+':'+event.subjectName+':'+String(event.daysUntil);
}

export function emitLiaContextualGuidance(event:LiaContextualGuidanceEvent):void{
  const key=eventKey(event),now=Date.now(),last=recentEventAt.get(key)??0;
  if(now-last<8_000)return;
  recentEventAt.set(key,now);
  if(recentEventAt.size>80){
    for(const [candidate,at] of recentEventAt)if(now-at>10*60_000)recentEventAt.delete(candidate);
  }
  if(listeners.size){for(const listener of listeners)listener(event);return;}
  pending.push(event);
  if(pending.length>8)pending.splice(0,pending.length-8);
}

export function addLiaContextualGuidanceListener(listener:Listener):()=>void{
  listeners.add(listener);
  if(pending.length){
    const queued=pending.splice(0,pending.length);
    for(const event of queued)listener(event);
  }
  return()=>{listeners.delete(listener);};
}


export async function emitLiaAppFeatureFirstUse(input:{householdId:string;organizerName:string;feature:LiaAppFeature}):Promise<boolean>{
  const organizerName=cleanName(input.organizerName);
  const key=`feature:${input.householdId}:${input.feature}`;
  const seen=await readStoredJson<Record<string,boolean>>(SEEN_KEY,{},validSeen);
  if(seen[key])return false;
  await writeStoredJson(SEEN_KEY,{...seen,[key]:true});
  emitLiaContextualGuidance({kind:'app_feature_first_use',householdId:input.householdId,organizerName,feature:input.feature});
  return true;
}

export function emitLiaAppFeatureHelp(input:{householdId:string;organizerName:string;feature:LiaAppFeature;step:LiaAppFeatureHelpStep}):void{
  emitLiaContextualGuidance({kind:'app_feature_help',householdId:input.householdId,organizerName:cleanName(input.organizerName),feature:input.feature,step:input.step});
}

export async function emitLiaFamilyMessageFirstUse(input:{householdId:string;organizerName:string}):Promise<boolean>{
  const organizerName=cleanName(input.organizerName);
  const key=`family_message:${input.householdId}:${organizerName.toLocaleLowerCase()||'organizer'}`;
  const seen=await readStoredJson<Record<string,boolean>>(SEEN_KEY,{},validSeen);
  if(seen[key])return false;
  await writeStoredJson(SEEN_KEY,{...seen,[key]:true});
  emitLiaContextualGuidance({kind:'family_message_first_use',householdId:input.householdId,organizerName});
  return true;
}

export function liaContextualGuidancePrompt(event:LiaContextualGuidanceEvent,languageTag:string):string{
  const fr=languageTag.toLowerCase().startsWith('fr');
  const who=event.organizerName.trim();
  const prefix=who?`${who}, `:'';
  if(event.kind==='app_feature_first_use'){
    const guide:Record<LiaAppFeature,string>={
      planning:fr?'explique brièvement que Planning sert à choisir le repas, les participants et éventuellement qui cuisine, puis à enregistrer le tout.':'briefly explain that Planning is where meals, participants and the cook can be chosen and saved.',
      shopping:fr?'explique brièvement que Courses permet d’ajouter les produits, de les cocher au magasin et que LIA peut aussi y envoyer des manquants quand on le lui demande.':'briefly explain that Shopping lets them add items, check them off in the store, and that LIA can add missing items when explicitly asked.',
      recipes:fr?'explique brièvement que Recettes permet de chercher, enregistrer ou importer une recette, puis de lancer le mode cuisine mains libres avec LIA.':'briefly explain that Recipes lets them find, save or import recipes and start hands-free cooking with LIA.',
      household:fr?'explique brièvement que Famille regroupe les personnes du foyer, leurs informations utiles et les réglages familiaux.':'briefly explain that Family contains household members, useful information and family settings.',
      commander:fr?'explique brièvement que Commander sert à trouver les options autour du foyer, filtrer par envie et ouvrir le lieu choisi.':'briefly explain that Order helps find nearby options, filter by craving and open the chosen place.',
      memos:fr?'explique brièvement que Mémos garde les idées ou décisions qu’on veut retrouver plus tard, et que LIA peut aussi y conserver une proposition quand on le lui demande.':'briefly explain that Memos keeps ideas or decisions for later and that LIA can save something there when asked.',
    };
    return fr?`${prefix}c’est la première fois que cette fonction est ouverte. ${guide[event.feature]} Une seule phrase ou deux, ton naturel, puis laisse la personne faire.`:`${prefix}this is the first time this feature is opened. ${guide[event.feature]} Keep it to one or two natural sentences, then let them continue.`;
  }
  if(event.kind==='app_feature_help'){
    const help:Record<LiaAppFeatureHelpStep,string>={
      choose_meal:fr?'la personne a ouvert un repas mais n’a encore choisi ni recette ni plat. Dis seulement de choisir une recette ou d’écrire le plat, puis attends.':'the person opened a meal but has not chosen a recipe or dish yet. Only tell them to choose a recipe or type the dish, then wait.',
      add_item:fr?'la liste de courses est vide et la personne n’a encore rien saisi. Indique simplement le champ d’ajout, puis tais-toi.':'the shopping list is empty and nothing has been entered. Simply point out the add field, then stop.',
      confirm_item:fr?'un produit est saisi dans Courses mais n’a pas été ajouté. Dis seulement d’appuyer sur le bouton + pour l’ajouter.':'an item is typed in Shopping but has not been added. Only tell them to press + to add it.',
      write_memo:fr?'la personne a ouvert la création d’un Mémo mais n’a pas encore donné de titre. Dis seulement de commencer par le titre.':'the person opened a new Memo but has not entered a title. Only tell them to start with the title.',
      complete_memo:fr?'le titre du Mémo est rempli mais pas son contenu. Dis seulement d’ajouter ce qu’elle veut retenir, puis d’enregistrer.':'the Memo title is filled but its content is empty. Only tell them to add what they want to remember, then save.',
      choose_location:fr?'Commander attend le choix entre l’adresse du foyer et la position actuelle. Explique uniquement ce choix.':'Order is waiting for a choice between the home address and current location. Explain only that choice.',
      set_address:fr?'Commander n’a pas d’adresse utilisable. Dis seulement d’indiquer l’adresse de livraison pour afficher les options proches.':'Order has no usable address. Only ask them to set the delivery address to show nearby options.',
    };
    return fr?`${prefix}${help[event.step]} Une étape à la fois, ton agréable, et ne répète pas ce qui a déjà été fait.`:`${prefix}${help[event.step]} One step at a time, friendly tone, and do not repeat completed steps.`;
  }
  if(event.kind==='family_message_first_use'){
    return fr
      ?`${prefix}c’est la première utilisation de Message famille. Explique en une seule intervention courte : choisir les options du repas, sélectionner les personnes à qui demander, envoyer, puis laisser LIA suivre les réponses et aider pour la suite. Ton chaleureux, naturel, pas de tutoriel récité. Ne répète pas cette explication plus tard sauf si la personne semble bloquée.`
      :`${prefix}this is the first use of Family Message. In one short intervention explain: choose the meal options, choose who to ask, send it, then let LIA follow the replies and help with what comes next. Warm and natural, not a scripted tutorial. Do not repeat later unless the person seems stuck.`;
  }
  if(event.kind==='family_message_help'){
    const task=event.step==='prepare'
      ?(fr?'elle semble hésiter avant de préparer la demande. Guide-la seulement vers le choix des options puis la préparation du message.':'they seem stuck before preparing the request. Guide only through choosing options and preparing the message.')
      :(fr?'la demande est prête mais aucun destinataire n’a encore été envoyé. Guide-la seulement pour choisir les prénoms et envoyer.':'the request is ready but no recipient has been sent yet. Guide only through choosing names and sending.');
    return fr?`${prefix}${task} Une étape à la fois, ton rassurant et léger, puis tais-toi dès qu’elle avance.`:`${prefix}${task} One step at a time, light and reassuring, then stop once they progress.`;
  }
  if(event.kind==='profile_enrichment_question'){
    if(event.fact==='favorite_meal'){
      return fr
        ?`${prefix}profite d’un moment calme pour apprendre une seule petite chose utile, sans donner l’impression d’un questionnaire. Demande naturellement quel est le plat que ${event.subjectName} adore vraiment. Une seule question, ton chaleureux, aucune insistance. N’invente aucune préférence si la cliente ne sait pas.`
        :`${prefix}use a calm moment to learn one useful family detail without sounding like a questionnaire. Naturally ask which dish ${event.subjectName} really loves. One question only, warm tone, no pressure. Never invent a preference if the organizer does not know.`;
    }
    return fr
      ?`${prefix}profite d’un moment calme pour apprendre une petite information familiale manquante, sans donner l’impression d’un formulaire. Demande simplement quand est l’anniversaire de ${event.subjectName}. Précise que le jour et le mois suffisent et que l’année est facultative. Une seule question, ton naturel et chaleureux, aucune insistance. Ne fais pas encore la blague : attends d’abord la réponse.`
      :`${prefix}use a calm moment to learn one small missing family detail without sounding like a form. Simply ask when ${event.subjectName}'s birthday is. Say that day and month are enough and the year is optional. Ask one question only, warmly, with no pressure.`;
  }
  if(event.kind==='birthday_awareness'){
    const timing=event.daysUntil===0?(fr?'aujourd’hui':'today'):event.daysUntil===1?(fr?'demain':'tomorrow'):(fr?`dans ${event.daysUntil} jours`:`in ${event.daysUntil} days`);
    const favorite=event.favoriteMeal?.trim()||'';
    return fr
      ?`${prefix}tu sais maintenant que l’anniversaire de ${event.subjectName} est ${timing}. Fais une intervention courte et naturelle. Ne mentionne jamais son âge.${favorite?` Tu sais aussi que ${event.subjectName} adore ${favorite} : tu peux t’en servir comme piste, sans présenter ça comme une décision.`:''} Si c’est pertinent, demande simplement si la cliente veut prévoir quelque chose pour le repas ou l’occasion, sans créer de rappel, achat, réservation ou planning sans demande explicite.`
      :`${prefix}you know that ${event.subjectName}'s birthday is ${timing}. Make one short natural intervention. Never mention their age.${favorite?` You also know ${event.subjectName} loves ${favorite}; you may use that as an idea, never as a decision.`:''} If useful, simply ask whether the organizer wants to plan something for the meal or occasion, without creating reminders, purchases, reservations, or plans unless explicitly asked.`;
  }
  if(event.kind==='family_choice_changed'){
    const label:Record<LightDesire,string>={home:'Plat fait maison',pizza:'Pizza',pasta:'Pâtes',sushi:'Sushi',chinese:'Chinois'};
    if(event.desire==='home'){
      if(event.homeStyle){
        const style=event.homeStyle==='easy'?(fr?'facile et efficace':'easy and effective'):(fr?'un peu plus spectaculaire':'a little more impressive');
        return fr
          ?`${prefix}${event.memberName} vient aussi de choisir « Plat fait maison ». Pour ce repas, la cliente a déjà choisi une direction ${style}. Ne repose surtout pas la question « facile ou épater la galerie ». Tu peux simplement constater ce nouveau choix si c’est utile, sinon reste silencieuse.`
          :`${prefix}${event.memberName} also chose “Home-cooked”. The organizer already chose a ${style} direction for this meal. Do not ask “easy or impress everyone?” again. Briefly acknowledge only if useful; otherwise stay silent.`;
      }
      return fr
        ?`${prefix}tu viens de voir une vraie réponse du tableau famille : ${event.memberName} a choisi « Plat fait maison » pour ce repas. Réagis naturellement et avec ton répondant : dis que tu l’as vu, demande si on veut faire facile ou épater la galerie, puis propose d’attendre les autres avant de se lancer ensemble, ou de s’y mettre plus tard. Reste court et ne prétends pas que toute la famille a déjà décidé. Cette question attend une vraie réponse : facile, épater la galerie, ou plus tard.`
        :`${prefix}you just received a real family-board reply: ${event.memberName} chose “Home-cooked” for this meal. React naturally: say you noticed it, ask whether to keep it easy or impress everyone, then suggest waiting for the others before starting together, or doing it later. Keep it short and do not imply the whole family has decided. This question expects a real answer: easy, impress everyone, or later.`;
    }
    return fr
      ?`${prefix}le tableau vient d’enregistrer le choix réel de ${event.memberName} : « ${label[event.desire]} ». N’interviens que si cela aide vraiment l’organisation ; sinon reste silencieuse.`
      :`${prefix}the board just recorded ${event.memberName}'s real choice: “${label[event.desire]}”. Only comment if it genuinely helps organize the meal; otherwise stay silent.`;
  }
  return fr
    ?event.active
      ?`${prefix}${event.memberName} vient de cocher « Je prends les choses en main » pour ce repas. Informe seulement la cliente qui organise : considère désormais ce repas comme pris en charge et évite les relances d’organisation pour ce repas tant que cette décision reste active. Ton agréable, un peu complice. Tu peux ponctuellement plaisanter avec « n’oubliez pas de m’inviter à table », mais pas systématiquement.`
      :`${prefix}${event.memberName} vient de retirer « Je prends les choses en main ». Dis simplement que le repas n’est plus considéré comme pris en charge et qu’on peut reprendre l’organisation si besoin.`
    :event.active
      ?`${prefix}${event.memberName} just checked “I’ll take care of everything” for this meal. Inform only the organizing customer: treat the meal as handled and avoid organization nudges for it while this remains active. Warm and lightly playful. You may occasionally joke about being invited to the table, but not every time.`
      :`${prefix}${event.memberName} just unchecked “I’ll take care of everything”. Briefly say the meal is no longer considered handled and organization can resume if needed.`;
}


function samePerson(a:string,b:string):boolean{return cleanName(a).toLocaleLowerCase()===cleanName(b).toLocaleLowerCase();}
function stableJoke(event:LiaContextualGuidanceEvent):boolean{
  const seed=event.kind==='family_take_charge_changed'?event.memberName+event.mealDate:event.kind==='profile_enrichment_question'?event.subjectName+event.fact:event.kind==='birthday_awareness'?event.subjectName+event.daysUntil:event.kind;
  let sum=0;for(const ch of seed)sum+=ch.charCodeAt(0);return sum%3===0;
}

export function liaContextualGuidanceFallback(event:LiaContextualGuidanceEvent,languageTag:string):string{
  const fr=languageTag.toLowerCase().startsWith('fr');
  const who=event.organizerName.trim();
  const prefix=who?`${who}, `:'';
  if(event.kind==='app_feature_first_use'){
    const copy:Record<LiaAppFeature,string>={
      planning:fr?'ici tu choisis le repas et les personnes concernées, puis tu enregistres.':'here you choose the meal and the people involved, then save it.',
      shopping:fr?'ici tu ajoutes ce qu’il faut acheter et tu coches les produits au fur et à mesure.':'here you add what to buy and check items off as you go.',
      recipes:fr?'ici tu retrouves tes recettes, tu peux en ajouter et lancer le mode cuisine avec moi.':'here you find your recipes, add new ones and start cooking mode with me.',
      household:fr?'ici tu retrouves les personnes du foyer et les informations familiales utiles.':'here you find household members and useful family information.',
      commander:fr?'ici tu choisis ce qui te fait envie et je t’aide à trouver les options autour de chez toi.':'here you choose what you feel like and I help you find nearby options.',
      memos:fr?'ici tu gardes ce que tu veux retrouver plus tard.':'here you keep things you want to find again later.',
    };
    return `${prefix}${copy[event.feature]}`;
  }
  if(event.kind==='app_feature_help'){
    const copy:Record<LiaAppFeatureHelpStep,string>={
      choose_meal:fr?'choisis une recette ou écris simplement le plat que tu veux prévoir.':'choose a recipe or simply type the dish you want to plan.',
      add_item:fr?'écris le premier produit dans le champ d’ajout.':'type the first item in the add field.',
      confirm_item:fr?'ton produit est prêt : appuie sur + pour l’ajouter.':'your item is ready: press + to add it.',
      write_memo:fr?'commence par donner un titre à ton Mémo.':'start by giving your Memo a title.',
      complete_memo:fr?'ajoute maintenant ce que tu veux retenir, puis enregistre.':'now add what you want to remember, then save.',
      choose_location:fr?'choisis si tu veux chercher autour de la maison ou autour de ta position actuelle.':'choose whether to search around home or your current location.',
      set_address:fr?'indique l’adresse de livraison et je pourrai afficher les options proches.':'set the delivery address and I can show nearby options.',
    };
    return `${prefix}${copy[event.step]}`;
  }
  if(event.kind==='family_message_first_use'){
    return fr
      ?`${prefix}dans Message famille, choisis les options du repas et les personnes à qui tu veux demander. Envoie, et ensuite je m’occupe de suivre les réponses avec toi.`
      :`${prefix}in Family Message, choose the meal options and who you want to ask. Send it, and then I’ll help you follow the replies.`;
  }
  if(event.kind==='family_message_help'){
    if(event.step==='prepare')return fr?`${prefix}choisis d’abord les options du repas. Ensuite on choisira à qui envoyer.`:`${prefix}choose the meal options first. Then we’ll choose who to send it to.`;
    return fr?`${prefix}la demande est prête. Choisis maintenant les personnes à qui l’envoyer, et je suis la suite avec toi.`:`${prefix}the request is ready. Choose who to send it to, and I’ll follow what happens with you.`;
  }
  if(event.kind==='profile_enrichment_question'){
    if(event.fact==='favorite_meal'){
      return fr
        ?`${prefix}au fait, c’est quoi le plat que ${event.subjectName} adore vraiment ? Je garde ça dans un coin de ma tête pour les bonnes occasions.`
        :`${prefix}by the way, what dish does ${event.subjectName} really love? I’ll keep it in mind for the right moments.`;
    }
    return fr
      ?`${prefix}au fait, pour que je pense aux anniversaires… c’est quand celui de ${event.subjectName} ? Le jour et le mois me suffisent.`
      :`${prefix}by the way, so I can keep birthdays in mind: when is ${event.subjectName}'s birthday? Day and month are enough; the year is optional.`;
  }
  if(event.kind==='birthday_awareness'){
    const self=samePerson(event.organizerName,event.subjectName);
    const favorite=event.favoriteMeal?.trim()||'';
    if(event.daysUntil===0){
      return fr
        ?self?`Joyeux anniversaire ${event.subjectName} 🎂. ${favorite?`Je sais que tu adores ${favorite}… ça peut être une piste si tu veux 😏. `:''}On peut rendre le repas un peu spécial aujourd’hui.`:`${prefix}c’est l’anniversaire de ${event.subjectName} aujourd’hui 🎂. ${favorite?`Je sais que ${event.subjectName} adore ${favorite}… ça peut être une piste si tu veux. `:''}Tu veux qu’on prévoie quelque chose de spécial pour le repas ?`
        :self?`Happy birthday ${event.subjectName} 🎂. If you want, we can make today's meal a little special.`:`${prefix}it’s ${event.subjectName}'s birthday today 🎂. Want to plan something special for the meal?`;
    }
    const timing=event.daysUntil===1?(fr?'demain':'tomorrow'):(fr?`dans ${event.daysUntil} jours`:`in ${event.daysUntil} days`);
    return fr
      ?`${prefix}petit rappel : l’anniversaire de ${event.subjectName}, c’est ${timing}.${favorite?` Je sais que ${event.subjectName} adore ${favorite}… ça peut nous donner une idée.`:''} Si tu veux prévoir quelque chose, je suis là.`
      :`${prefix}quick heads-up: ${event.subjectName}'s birthday is ${timing}. If you want to plan something, I’m here.`;
  }
  if(event.kind==='family_choice_changed'){
    if(event.desire!=='home')return'';
    if(event.homeStyle){
      const style=event.homeStyle==='easy'?(fr?'facile':'easy'):(fr?'on épate la galerie':'impress everyone');
      return fr
        ?`${event.memberName} rejoint le camp du fait maison. Je garde notre direction : ${style}.`
        :`${event.memberName} joined the home-cooked camp. I’ll keep our direction: ${style}.`;
    }
    const self=samePerson(event.organizerName,event.memberName);
    return fr
      ?self
        ?`J’ai vu que tu as choisi Plat fait maison 😏. Tu veux qu’on fasse facile ou qu’on épate la galerie ? On peut attendre de voir ce que veulent les autres et se lancer après, ou plus tard si tu préfères.`
        :`J’ai vu que ${event.memberName} a choisi Plat fait maison 😏. Tu veux qu’on fasse facile ou qu’on épate la galerie ? On peut attendre les autres et se lancer après, ou plus tard si tu préfères.`
      :self
        ?`I saw you chose Home-cooked 😏. Do you want to keep it easy or impress everyone? We can wait for the others and start together later if you prefer.`
        :`I saw ${event.memberName} chose Home-cooked 😏. Do you want to keep it easy or impress everyone? We can wait for the others, then get started together, or do it later if you prefer.`;
  }
  if(event.active){
    const joke=stableJoke(event);
    return fr
      ?`${prefix}${event.memberName} prend les choses en main pour ce repas. Je le considère réglé pour l’instant et je ne vais pas vous relancer pour l’organisation.${joke?' Et n’oubliez pas de m’inviter à table 😏.':''}`
      :`${prefix}${event.memberName} is taking care of this meal. I’ll treat it as handled for now and won’t keep nudging you about organizing it.${joke?' And don’t forget to invite me to the table 😏.':''}`;
  }
  return fr
    ?`${prefix}${event.memberName} ne prend plus ce repas en charge. Si tu veux, on peut reprendre l’organisation.`
    :`${prefix}${event.memberName} is no longer taking charge of this meal. We can pick the organization back up if you want.`;
}
