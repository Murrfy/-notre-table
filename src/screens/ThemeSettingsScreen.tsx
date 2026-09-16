import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import { useAppTheme, type AppThemeMode } from '../context/ThemeContext';
import { colors, radius } from '../theme';

const options: Array<{value:AppThemeMode; icon:string; label:'settings.themeSystem'|'settings.themeLight'|'settings.themeDark'}> = [
  { value:'system', icon:'◐', label:'settings.themeSystem' },
  { value:'light', icon:'☀', label:'settings.themeLight' },
  { value:'dark', icon:'☾', label:'settings.themeDark' },
];

export function ThemeSettingsScreen({onClose}:{onClose:()=>void}) {
  const locale=useLocale();
  const theme=useAppTheme();
  const rtl=locale.textDirection==='rtl';
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{flex:1}}>
          <Text style={[styles.kicker,rtl&&styles.rtl]}>{locale.t('settings.appearance')}</Text>
          <Text style={[styles.title,rtl&&styles.rtl]}>{locale.t('settings.appearanceTitle')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}><Text style={styles.close}>{locale.t('common.close')}</Text></Pressable>
      </View>

      <View style={styles.card}>
        {options.map((option,index)=>{
          const active=theme.preference===option.value;
          return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} key={option.value} onPress={()=>theme.setPreference(option.value)} style={[styles.option,index>0&&styles.optionBorder]}>
            <View style={[styles.icon,active&&styles.iconActive]}><Text style={[styles.iconText,active&&styles.iconTextActive]}>{option.icon}</Text></View>
            <Text style={[styles.optionText,rtl&&styles.rtl]}>{locale.t(option.label)}</Text>
            <View style={[styles.radio,active&&styles.radioActive]}>{active?<View style={styles.radioDot}/>:null}</View>
          </Pressable>;
        })}
      </View>

      <View style={styles.note}>
        <Text style={[styles.noteTitle,rtl&&styles.rtl]}>{locale.t('settings.appearanceValue')}</Text>
        <Text style={[styles.noteText,rtl&&styles.rtl]}>{locale.t('settings.themeNote')}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream},
  content:{padding:22,paddingTop:30,paddingBottom:40},
  header:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:16},
  kicker:{color:colors.sageDark,fontSize:11,fontWeight:'900',letterSpacing:1.2},
  title:{color:colors.ink,fontSize:30,fontWeight:'900',marginTop:5},
  close:{color:colors.sageDark,fontWeight:'800',paddingVertical:4},
  card:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:16,marginTop:24},
  option:{minHeight:68,flexDirection:'row',alignItems:'center',gap:13},
  optionBorder:{borderTopWidth:1,borderTopColor:colors.border},
  icon:{width:38,height:38,borderRadius:12,backgroundColor:colors.neutralSoft,alignItems:'center',justifyContent:'center'},
  iconActive:{backgroundColor:colors.sageSoft},
  iconText:{color:colors.muted,fontSize:18,fontWeight:'900'},
  iconTextActive:{color:colors.sageDark},
  optionText:{flex:1,color:colors.ink,fontSize:15,fontWeight:'800'},
  radio:{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  radioActive:{borderColor:colors.sageDark},
  radioDot:{width:10,height:10,borderRadius:5,backgroundColor:colors.sageDark},
  note:{backgroundColor:colors.sageCard,borderWidth:1,borderColor:colors.sageBorder,borderRadius:radius.md,padding:16,marginTop:18},
  noteTitle:{color:colors.ink,fontSize:13,fontWeight:'800'},
  noteText:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:5},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
