import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import { colors } from '../theme';
import { TableMark } from './TableMark';

type Props={
  title:string;
  message:string;
  primaryLabel:string;
  onPrimary:()=>void;
  secondaryLabel?:string;
  onSecondary?:()=>void;
};

export function RecoveryScreen({title,message,primaryLabel,onPrimary,secondaryLabel,onSecondary}:Props){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  return <SafeAreaView style={styles.safe}>
    <View style={styles.center}>
      <TableMark size={72}/>
      <Text style={[styles.brand,rtl&&styles.rtl]}>{locale.t('brand')}</Text>
      <View style={styles.copy}>
        <Text style={[styles.title,rtl&&styles.rtl]}>{title}</Text>
        <Text style={[styles.message,rtl&&styles.rtl]}>{message}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onPrimary} style={styles.primary}>
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>
      {secondaryLabel&&onSecondary?<Pressable accessibilityRole="button" onPress={onSecondary} style={styles.secondary}>
        <Text style={[styles.secondaryText,rtl&&styles.rtl]}>{secondaryLabel}</Text>
      </Pressable>:null}
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream},
  center:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:30,gap:18},
  brand:{color:colors.sageDark,fontSize:14,fontWeight:'900',letterSpacing:2},
  copy:{maxWidth:420,gap:10,alignItems:'center'},
  title:{color:colors.ink,fontSize:26,lineHeight:32,fontWeight:'800',textAlign:'center'},
  message:{color:colors.muted,fontSize:14,lineHeight:21,textAlign:'center'},
  primary:{minWidth:190,alignItems:'center',backgroundColor:colors.sageDark,paddingHorizontal:22,paddingVertical:14,borderRadius:16},
  primaryText:{color:colors.onAccent,fontWeight:'800',fontSize:15},
  secondary:{paddingHorizontal:16,paddingVertical:10},
  secondaryText:{color:colors.sageDark,fontWeight:'700',fontSize:14},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
