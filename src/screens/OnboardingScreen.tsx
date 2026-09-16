import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { TableMark } from '../components/TableMark';
import { colors, radius } from '../theme';
import { useLocale } from '../context/LocaleContext';

export function OnboardingScreen({onDone}:{onDone:()=>void}){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  const rowDirection=rtl?'row-reverse':'row';
  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <View style={styles.hero}>
      <View style={styles.markRow}><TableMark size={92}/></View>
      <Text style={[styles.brand,rtl&&styles.rtl]}>{locale.t('brand')}</Text>
      <Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('onboarding.title')}</Text>
      <Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('onboarding.subtitle')}</Text>
    </View>

    <View style={styles.promiseCard}>
      {(['onboarding.promise1','onboarding.promise2','onboarding.promise3'] as const).map((key,index)=><View key={key} style={[styles.promiseRow,{flexDirection:rowDirection},index>0&&styles.promiseBorder]}>
        <View style={[styles.number,index===1&&styles.numberWarm]}><Text style={styles.numberText}>{index+1}</Text></View>
        <Text style={[styles.promiseText,rtl&&styles.rtl]}>{locale.t(key)}</Text>
      </View>)}
    </View>

    <View>
      <PrimaryButton label={locale.t('common.start')} onPress={onDone}/>
      <Text style={[styles.note,rtl&&styles.rtl]}>{locale.t('onboarding.note')}</Text>
    </View>
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream},
  container:{flex:1,paddingHorizontal:24,paddingTop:28,paddingBottom:20,justifyContent:'space-between'},
  hero:{alignItems:'center',paddingTop:8},
  markRow:{marginBottom:18},
  brand:{color:colors.sageDark,fontWeight:'900',letterSpacing:2,fontSize:12,textAlign:'center'},
  title:{color:colors.ink,fontSize:34,lineHeight:40,fontWeight:'900',textAlign:'center',marginTop:18,maxWidth:520},
  subtitle:{color:colors.muted,fontSize:16,lineHeight:24,textAlign:'center',marginTop:10,maxWidth:500},
  promiseCard:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:16,marginVertical:22},
  promiseRow:{minHeight:70,alignItems:'center',gap:13,paddingVertical:13},
  promiseBorder:{borderTopWidth:1,borderTopColor:colors.border},
  number:{width:34,height:34,borderRadius:17,backgroundColor:colors.sageSoft,alignItems:'center',justifyContent:'center'},
  numberWarm:{backgroundColor:colors.orangeSoft},
  numberText:{color:colors.sageDark,fontSize:13,fontWeight:'900'},
  promiseText:{flex:1,color:colors.ink,fontSize:14,lineHeight:20,fontWeight:'700'},
  note:{textAlign:'center',color:colors.muted,fontSize:11,marginTop:12},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
