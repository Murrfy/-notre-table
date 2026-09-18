import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScreenHeader} from '../components/ScreenHeader';
import {useLocale} from '../context/LocaleContext';
import {colors,radius} from '../theme';
import {openLiaPrivateMessage,type LiaPrivateMessage} from '../services/liaPrivateInbox';

export function LiaPrivateMessageScreen({ownerId,messageId,onClose}:{ownerId:string;messageId:string;onClose:()=>void}){
  const locale=useLocale();const rtl=locale.textDirection==='rtl';
  const[message,setMessage]=useState<LiaPrivateMessage|null>(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;setLoading(true);openLiaPrivateMessage(ownerId,messageId).then(value=>{if(active)setMessage(value);}).catch(()=>{if(active)setMessage(null);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[ownerId,messageId]);
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
    <ScreenHeader title={locale.t('lia.privateMessageTitle')} subtitle={locale.t('lia.privateMessageNote')} right={<Pressable accessibilityRole="button" accessibilityLabel={locale.t('common.close')} onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>}/>
    {loading?<ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark}/>:message?<View style={styles.card}><Text style={[styles.text,rtl&&styles.rtl]}>{message.text}</Text></View>:<View style={styles.card}><Text style={[styles.unavailable,rtl&&styles.rtl]}>{locale.t('lia.privateMessageUnavailable')}</Text></View>}
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.cream},container:{padding:20,paddingBottom:44},close:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:colors.neutralSoft},closeText:{fontSize:28,lineHeight:30,color:colors.ink},card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:18},text:{color:colors.ink,fontSize:16,lineHeight:25},unavailable:{color:colors.muted,fontSize:14,lineHeight:22},rtl:{textAlign:'right',writingDirection:'rtl'}});
