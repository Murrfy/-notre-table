import React,{useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TableMark} from '../components/TableMark';
import {PrimaryButton} from '../components/PrimaryButton';
import {useLocale} from '../context/LocaleContext';
import {supportedLanguages,SupportedLanguage} from '../i18n';
import {colors,radius} from '../theme';

export function LanguageFirstScreen({onDone}:{onDone:(language:SupportedLanguage)=>Promise<void>|void}){
  const locale=useLocale();
  const [selected,setSelected]=useState<SupportedLanguage>(locale.language);
  const [saving,setSaving]=useState(false);
  const rtl=locale.textDirection==='rtl';
  const submit=async()=>{
    if(saving)return;
    setSaving(true);
    try{await onDone(selected);}finally{setSaving(false);}
  };
  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <View style={styles.header}>
      <TableMark size={76}/>
      <Text style={styles.brand}>NOTRE TABLE</Text>
      <Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('languageFirst.title')}</Text>
      <Text style={[styles.subtitle,rtl&&styles.rtl]}>{locale.t('languageFirst.subtitle')}</Text>
    </View>

    <View style={styles.languages} accessibilityRole="radiogroup">
      {supportedLanguages.map(language=>{
        const active=selected===language.code;
        return <Pressable key={language.code} accessibilityRole="radio" accessibilityState={{checked:active}} accessibilityLabel={language.nativeLabel} onPress={()=>setSelected(language.code)} style={[styles.language,active&&styles.languageActive]}>
          <Text style={[styles.nativeLabel,language.rtl&&styles.rtl]}>{language.nativeLabel}</Text>
          <Text style={[styles.languageLabel,language.rtl&&styles.rtl]}>{language.label}</Text>
          <View style={[styles.radio,active&&styles.radioActive]}>{active?<View style={styles.radioDot}/>:null}</View>
        </Pressable>;
      })}
    </View>

    <View>
      <PrimaryButton label={saving?locale.t('languageFirst.saving'):locale.t('languageFirst.continue')} onPress={()=>{void submit();}} disabled={saving}/>
      <Text style={[styles.note,rtl&&styles.rtl]}>{locale.t('languageFirst.note')}</Text>
    </View>
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream},
  container:{flex:1,paddingHorizontal:24,paddingTop:24,paddingBottom:20,justifyContent:'space-between'},
  header:{alignItems:'center',gap:10},
  brand:{color:colors.sageDark,fontWeight:'900',letterSpacing:2,fontSize:12},
  title:{color:colors.ink,fontSize:32,lineHeight:38,fontWeight:'900',textAlign:'center',marginTop:8},
  subtitle:{color:colors.muted,fontSize:15,lineHeight:22,textAlign:'center',maxWidth:500},
  languages:{gap:10,marginVertical:20},
  language:{minHeight:62,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.paper,paddingHorizontal:16,paddingVertical:12,justifyContent:'center'},
  languageActive:{borderColor:colors.sageDark,backgroundColor:colors.sageCard},
  nativeLabel:{color:colors.ink,fontSize:17,fontWeight:'900',paddingRight:44},
  languageLabel:{color:colors.muted,fontSize:12,marginTop:2,paddingRight:44},
  radio:{position:'absolute',right:16,width:22,height:22,borderRadius:11,borderWidth:2,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  radioActive:{borderColor:colors.sageDark},
  radioDot:{width:10,height:10,borderRadius:5,backgroundColor:colors.sageDark},
  note:{textAlign:'center',color:colors.muted,fontSize:11,lineHeight:16,marginTop:11},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
