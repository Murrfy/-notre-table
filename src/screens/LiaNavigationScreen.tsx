import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LiaNavigationMapView,type LiaNavigationProgressEvent,type LiaNavigationRouteStatusEvent} from '../../modules/lia-navigation';
import {useLocale} from '../context/LocaleContext';
import {colors,radius} from '../theme';
import {prepareLiaNavigationOrigin,type LiaNavigationLocationResult} from '../services/liaNavigationLocation';
import {prepareLiaGoogleNavigationRuntime,type LiaGoogleNavigationReadiness} from '../services/liaGoogleNavigationReadiness';
import {resolveLiaNavigationDestination,type LiaNavigationDestinationCandidate,type LiaNavigationDestinationResolution} from '../services/liaNavigationDestination';
import {reserveLiaNavigationTrip} from '../services/liaNavigationQuota';
import {getPreferredLiaVoice,speakLia} from '../services/liaVoice';
import {beginLiaNavigationLiveSession,endLiaNavigationLiveSession,updateLiaNavigationLiveSession} from '../services/liaNavigationLiveSession';
import {subscribeLiaNavigationLiveControl} from '../services/liaNavigationLiveControl';

function copy(languageTag:string){
  const fr=languageTag.toLowerCase().startsWith('fr');
  return fr?{
    kicker:'EN ROUTE AVEC LIA',title:'Je prépare la route',position:'Position actuelle',positionReady:'Position détectée',permission:'J’ai besoin de ta position pour te guider.',unavailable:'La localisation de ce build n’est pas disponible.',locationUnavailable:'Je n’arrive pas à obtenir ta position pour le moment.',engineUnavailable:'Le moteur Google Navigation n’est pas encore activé sur ce build. Je ne vais pas inventer un itinéraire.',termsDeclined:'Les conditions Google Navigation doivent être acceptées pour démarrer le guidage.',destinationUnavailable:'Je n’arrive pas à vérifier cette destination pour le moment.',destinationNotFound:'Je n’ai pas trouvé cette destination de façon assez fiable.',chooseDestination:'J’ai trouvé plusieurs possibilités. Laquelle veux-tu ?',quotaUnavailable:'Je ne peux pas vérifier le quota de navigation pour le moment. Je préfère ne pas lancer un trajet qui pourrait être facturé à tort.',failed:'Je n’ai pas réussi à démarrer le guidage.',close:'Fermer',destination:'Destination',eta:'Arrivée estimée',distance:'Distance restante',starting:'Je calcule le trajet…',rerouting:'Je recalcule l’itinéraire…',next:'Prochaine indication',stopoverReached:'On y est. Je reprends ensuite la route.'}:{
    kicker:'ON THE ROAD WITH LIA',title:'Preparing your route',position:'Current position',positionReady:'Location detected',permission:'I need your location to guide you.',unavailable:'Location is not available in this build.',locationUnavailable:'I cannot get your location right now.',engineUnavailable:'Google Navigation is not enabled in this build yet. I will not invent a route.',termsDeclined:'Google Navigation terms must be accepted before guidance can start.',destinationUnavailable:'I cannot verify this destination right now.',destinationNotFound:'I could not find this destination reliably enough.',chooseDestination:'I found several possibilities. Which one do you mean?',quotaUnavailable:'I cannot verify the navigation quota right now. I would rather not start a trip that could be billed incorrectly.',failed:'I could not start guidance.',close:'Close',destination:'Destination',eta:'Estimated arrival',distance:'Distance remaining',starting:'Calculating the route…',rerouting:'Recalculating route…',next:'Next direction',stopoverReached:'We are here. I will continue the route afterwards.'};
}

function formatStepDistance(meters:number|null|undefined){
  if(meters===null||meters===undefined||!Number.isFinite(meters)||meters<0)return null;
  if(meters<1000)return `${Math.max(10,Math.round(meters/10)*10)} m`;
  return `${(meters/1000).toFixed(meters<10000?1:0)} km`;
}


export function LiaNavigationScreen({destination,householdId,demo=false,onClose,onFamilyRequired}:{destination:string;householdId:string;demo?:boolean;onClose:()=>void;onFamilyRequired?:()=>void}){
  const locale=useLocale();const c=copy(locale.languageTag);
  const[locationState,setLocationState]=useState<LiaNavigationLocationResult|null>(null);
  const[readiness,setReadiness]=useState<LiaGoogleNavigationReadiness|null>(null);
  const[resolution,setResolution]=useState<LiaNavigationDestinationResolution|null>(null);
  const[selected,setSelected]=useState<LiaNavigationDestinationCandidate|null>(null);
  const[guidanceRequested,setGuidanceRequested]=useState(false);
  const[routeStatus,setRouteStatus]=useState<LiaNavigationRouteStatusEvent|null>(null);
  const[progress,setProgress]=useState<LiaNavigationProgressEvent|null>(null);
  const[quotaMessage,setQuotaMessage]=useState<string|null>(null);
  const[pendingQuotaNotice,setPendingQuotaNotice]=useState<string|null>(null);
  const[stopover,setStopover]=useState<LiaNavigationDestinationCandidate|null>(null);
  const reservedKeyRef=useRef<string|null>(null);

  useEffect(()=>{let active=true;void(async()=>{
    setReadiness(null);setResolution(null);setSelected(null);setGuidanceRequested(false);setRouteStatus(null);setProgress(null);setQuotaMessage(null);setStopover(null);reservedKeyRef.current=null;
    const origin=await prepareLiaNavigationOrigin();if(!active)return;setLocationState(origin);if(origin.status!=='ready')return;
    const ready=await prepareLiaGoogleNavigationRuntime();if(!active)return;setReadiness(ready);if(ready.status!=='ready')return;
    const resolved=await resolveLiaNavigationDestination({query:destination,origin:origin.location,languageTag:locale.languageTag});if(!active)return;
    setResolution(resolved);if(resolved.status==='resolved')setSelected(resolved.candidate);
  })();return()=>{active=false;};},[destination,locale.languageTag]);

  useEffect(()=>()=>{endLiaNavigationLiveSession();},[]);
  useEffect(()=>subscribeLiaNavigationLiveControl(command=>{
    if(command.kind==='stop'){setGuidanceRequested(false);endLiaNavigationLiveSession();onClose();return;}
    if(command.kind==='add_stop'){setStopover(command.candidate);}
  }),[onClose]);

  useEffect(()=>{if(!selected||readiness?.status!=='ready')return;const key=`${selected.placeId}|${selected.latitude}|${selected.longitude}`;if(reservedKeyRef.current===key)return;reservedKeyRef.current=key;let active=true;void(async()=>{
    const reservation=await reserveLiaNavigationTrip({householdId,languageTag:locale.languageTag,demo});if(!active)return;
    if(reservation.status==='family_plan_required'){reservedKeyRef.current=null;onFamilyRequired?.();return;}
    if(reservation.status==='exhausted'){setQuotaMessage(reservation.notice);const voice=await getPreferredLiaVoice(locale.languageTag);if(active)void speakLia(reservation.notice,locale.languageTag,voice?.identifier);return;}
    if(reservation.status==='unavailable'){setQuotaMessage(c.quotaUnavailable);return;}
    setPendingQuotaNotice(reservation.notice??null);setGuidanceRequested(true);
  })();return()=>{active=false;};},[selected,readiness?.status,householdId,demo,locale.languageTag]);

  async function handleRouteStatus(event:{nativeEvent:LiaNavigationRouteStatusEvent}){
    setRouteStatus(event.nativeEvent);
    if(event.nativeEvent.status==='started'){beginLiaNavigationLiveSession({title:selected?.title??destination,placeId:selected?.placeId??null,latitude:selected?.latitude??null,longitude:selected?.longitude??null});if(pendingQuotaNotice){const voice=await getPreferredLiaVoice(locale.languageTag);void speakLia(pendingQuotaNotice,locale.languageTag,voice?.identifier);setPendingQuotaNotice(null);}}
    if(event.nativeEvent.status==='failed')endLiaNavigationLiveSession();
  }

  const loading=!locationState||(locationState.status==='ready'&&!readiness)||(readiness?.status==='ready'&&!resolution);
  const readinessMessage=readiness&&readiness.status!=='ready'?(readiness.status==='location_permission_denied'?c.permission:readiness.status==='terms_declined'?c.termsDeclined:c.engineUnavailable):null;
  const locationMessage=locationState?.status==='permission_denied'?c.permission:locationState?.status==='unavailable'?c.unavailable:locationState?.status==='location_unavailable'?c.locationUnavailable:null;
  const resolutionMessage=resolution?.status==='not_found'?c.destinationNotFound:resolution?.status==='unavailable'?c.destinationUnavailable:null;
  const message=quotaMessage??locationMessage??readinessMessage??resolutionMessage??(routeStatus?.status==='failed'?c.failed:null);
  const etaMinutes=progress?Math.max(1,Math.round(progress.etaSeconds/60)):null;
  const distanceKm=progress?progress.distanceMeters/1000:null;
  const stepDistance=formatStepDistance(progress?.stepDistanceMeters);
  const instruction=progress?.navState==='rerouting'?c.rerouting:(progress?.instruction||progress?.roadName||null);

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><View style={{flex:1}}><Text style={styles.kicker}>{c.kicker}</Text><Text style={styles.title}>{c.title}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={c.close} onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
    <View style={styles.body}>
      <View style={styles.destinationCard}><Text style={styles.label}>{c.destination}</Text><Text style={styles.destination}>{selected?.title??destination}</Text>{selected?.address?<Text style={styles.address}>{selected.address}</Text>:null}</View>
      {loading?<View style={styles.center}><ActivityIndicator accessibilityRole="progressbar" color={colors.sageDark}/><Text style={styles.status}>{locationState?.status==='ready'?c.positionReady:c.position}</Text></View>:null}
      {!loading&&resolution?.status==='ambiguous'&&!selected?<View style={styles.choices}><Text style={styles.choiceTitle}>{c.chooseDestination}</Text>{resolution.candidates.map(candidate=><Pressable key={candidate.placeId} accessibilityRole="button" accessibilityLabel={`${candidate.title}, ${candidate.address}`} onPress={()=>setSelected(candidate)} style={styles.choice}><Text style={styles.choiceName}>{candidate.title}</Text><Text style={styles.choiceAddress}>{candidate.address}</Text></Pressable>)}</View>:null}
      {!loading&&selected&&guidanceRequested&&!quotaMessage?<View style={styles.mapWrap}><LiaNavigationMapView style={StyleSheet.absoluteFill} destinationLatitude={selected.latitude} destinationLongitude={selected.longitude} destinationPlaceId={selected.placeId} destinationTitle={selected.title} stopoverLatitude={stopover?.latitude} stopoverLongitude={stopover?.longitude} stopoverPlaceId={stopover?.placeId} stopoverTitle={stopover?.title} guidanceRequested onRouteStatus={event=>void handleRouteStatus(event)} onProgress={event=>{setProgress(event.nativeEvent);updateLiaNavigationLiveSession(event.nativeEvent);}} onArrival={event=>{if(event.nativeEvent.kind==='stopover'){void getPreferredLiaVoice(locale.languageTag).then(voice=>speakLia(c.stopoverReached,locale.languageTag,voice?.identifier));setStopover(null);return;}endLiaNavigationLiveSession();setGuidanceRequested(false);}}/>{instruction?<View pointerEvents="none" style={styles.instructionOverlay}><Text style={styles.instructionLabel}>{c.next}{stepDistance?` · ${stepDistance}`:''}</Text><Text accessibilityLiveRegion="polite" style={styles.instructionText}>{instruction}</Text></View>:null}<View pointerEvents="none" style={styles.metricsOverlay}><View><Text style={styles.metricLabel}>{c.eta}</Text><Text style={styles.metricValue}>{etaMinutes===null?'—':`${etaMinutes} min`}</Text></View><View><Text style={styles.metricLabel}>{c.distance}</Text><Text style={styles.metricValue}>{distanceKm===null?'—':`${distanceKm.toFixed(1)} km`}</Text></View></View>{routeStatus?.status!=='started'?<View pointerEvents="none" style={styles.starting}><ActivityIndicator color={colors.sageDark}/><Text style={styles.status}>{c.starting}</Text></View>:null}</View>:null}
      {message?<View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View>:null}
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},header:{flexDirection:'row',alignItems:'flex-start',paddingHorizontal:20,paddingTop:12,paddingBottom:10,gap:12},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.8,color:colors.sageDark},title:{fontSize:28,fontWeight:'900',color:colors.ink,marginTop:4},close:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:colors.neutralSoft},closeText:{fontSize:28,lineHeight:30,color:colors.ink},body:{flex:1,paddingHorizontal:20,paddingBottom:20,gap:12},destinationCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14},label:{fontSize:11,fontWeight:'900',textTransform:'uppercase',letterSpacing:1,color:colors.muted},destination:{fontSize:21,fontWeight:'900',color:colors.ink,marginTop:4},address:{fontSize:13,lineHeight:18,color:colors.muted,marginTop:3},center:{flex:1,alignItems:'center',justifyContent:'center',gap:12},status:{fontSize:14,color:colors.muted,fontWeight:'700'},notice:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:18},noticeText:{fontSize:15,lineHeight:22,color:colors.ink,fontWeight:'700'},choices:{gap:10},choiceTitle:{fontSize:16,fontWeight:'900',color:colors.ink},choice:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14},choiceName:{fontSize:16,fontWeight:'900',color:colors.ink},choiceAddress:{fontSize:13,color:colors.muted,marginTop:3},mapWrap:{flex:1,minHeight:300,borderRadius:radius.md,overflow:'hidden',backgroundColor:colors.neutralSoft},instructionOverlay:{position:'absolute',left:12,right:12,top:12,backgroundColor:'rgba(255,255,255,0.96)',borderRadius:radius.md,paddingHorizontal:14,paddingVertical:12},instructionLabel:{fontSize:11,fontWeight:'900',letterSpacing:.6,color:colors.sageDark,textTransform:'uppercase'},instructionText:{fontSize:22,lineHeight:28,fontWeight:'900',color:colors.ink,marginTop:4},metricsOverlay:{position:'absolute',left:12,right:12,bottom:12,flexDirection:'row',justifyContent:'space-between',gap:16,backgroundColor:'rgba(255,255,255,0.94)',borderRadius:radius.md,padding:12},metricLabel:{fontSize:11,fontWeight:'800',color:colors.muted},metricValue:{fontSize:20,fontWeight:'900',color:colors.ink,marginTop:3},starting:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'rgba(255,255,255,0.82)'}});
