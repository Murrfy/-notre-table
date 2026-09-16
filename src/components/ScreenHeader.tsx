import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import { colors } from '../theme';

export function ScreenHeader({ title, subtitle, right }:{ title:string; subtitle?:string; right?:ReactNode }){
  const locale=useLocale();
  const rtl=locale.textDirection==='rtl';
  return <View style={[styles.wrap,rtl&&styles.wrapRtl]}>
    <View style={styles.copy}>
      <Text style={[styles.title,rtl&&styles.rtl]}>{title}</Text>
      {subtitle?<Text style={[styles.subtitle,rtl&&styles.rtl]}>{subtitle}</Text>:null}
    </View>
    {right?<View style={styles.right}>{right}</View>:null}
  </View>;
}

const styles=StyleSheet.create({
  wrap:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14,marginTop:6,marginBottom:16},
  wrapRtl:{flexDirection:'row-reverse'},
  copy:{flex:1,minWidth:0},
  title:{color:colors.ink,fontSize:30,lineHeight:35,fontWeight:'900',letterSpacing:-.55},
  subtitle:{color:colors.muted,fontSize:12,lineHeight:18,fontWeight:'600',marginTop:4},
  right:{alignSelf:'center'},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
