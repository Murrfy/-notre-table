import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { TabKey } from '../types';
import { useLocale } from '../context/LocaleContext';

type Props = { active: TabKey; onChange: (tab: TabKey) => void };
const tabs: Array<{ key: TabKey; label: 'tabs.planning'|'tabs.recipes'|'tabs.shopping'|'tabs.household' }> = [
  { key: 'planning', label: 'tabs.planning' },
  { key: 'recipes', label: 'tabs.recipes' },
  { key: 'shopping', label: 'tabs.shopping' },
  { key: 'household', label: 'tabs.household' },
];

function TabIcon({kind,active}:{kind:TabKey;active:boolean}){
  const tone=active?colors.sageDark:colors.iconMuted;
  if(kind==='planning') return <View style={styles.iconBox}><View style={[styles.calendar,{borderColor:tone}]}><View style={[styles.calendarLine,{backgroundColor:tone}]}/><View style={styles.calendarDots}><View style={[styles.tinyDot,{backgroundColor:tone}]}/><View style={[styles.tinyDot,{backgroundColor:tone}]}/><View style={[styles.tinyDot,{backgroundColor:tone}]}/></View></View></View>;
  if(kind==='recipes') return <View style={styles.iconBox}><View style={[styles.recipePlate,{borderColor:tone}]}/><View style={[styles.recipeStem,{backgroundColor:tone}]}/><View style={[styles.recipeStem2,{backgroundColor:tone}]}/></View>;
  if(kind==='shopping') return <View style={styles.iconBox}><View style={[styles.basketHandle,{borderColor:tone}]}/><View style={[styles.basket,{borderColor:tone}]}><View style={[styles.basketLine,{backgroundColor:tone}]}/></View></View>;
  return <View style={styles.iconBox}><View style={[styles.personHead,{backgroundColor:tone}]}/><View style={[styles.personBody,{borderColor:tone}]}/><View style={[styles.personHeadSmall,{backgroundColor:tone}]}/><View style={[styles.personBodySmall,{borderColor:tone}]}/></View>;
}

export function TabBar({ active, onChange }: Props) {
  const locale=useLocale();
  return <View style={styles.wrap}>{tabs.map(tab=>{
    const selected=tab.key===active;
    return <Pressable key={tab.key} accessibilityRole="button" accessibilityState={{selected}} onPress={()=>onChange(tab.key)} style={styles.tab}>
      <View style={[styles.iconHalo,selected&&styles.iconHaloActive]}><TabIcon kind={tab.key} active={selected}/></View>
      <Text style={[styles.label,selected&&styles.labelActive]}>{locale.t(tab.label)}</Text>
    </Pressable>;
  })}</View>;
}

const styles=StyleSheet.create({
  wrap:{flexDirection:'row',borderTopWidth:1,borderTopColor:colors.border,backgroundColor:colors.paper,paddingTop:7,paddingBottom:9,paddingHorizontal:6},
  tab:{flex:1,alignItems:'center',justifyContent:'center',gap:2,minHeight:54},
  iconHalo:{width:42,height:30,borderRadius:15,alignItems:'center',justifyContent:'center'},
  iconHaloActive:{backgroundColor:colors.sageSoft},
  label:{color:colors.muted,fontSize:10,fontWeight:'700'},
  labelActive:{color:colors.sageDark,fontWeight:'900'},
  iconBox:{width:24,height:22,position:'relative',alignItems:'center',justifyContent:'center'},
  calendar:{width:19,height:18,borderWidth:1.8,borderRadius:5,paddingTop:6,paddingHorizontal:3},
  calendarLine:{position:'absolute',left:2,right:2,top:5,height:1.5,borderRadius:2},
  calendarDots:{flexDirection:'row',justifyContent:'space-between'},
  tinyDot:{width:2.8,height:2.8,borderRadius:2},
  recipePlate:{width:18,height:18,borderWidth:1.8,borderRadius:9},
  recipeStem:{position:'absolute',width:1.7,height:13,left:1,top:4,borderRadius:2},
  recipeStem2:{position:'absolute',width:1.7,height:13,right:1,top:4,borderRadius:2},
  basketHandle:{position:'absolute',top:1,width:12,height:8,borderWidth:1.7,borderBottomWidth:0,borderTopLeftRadius:7,borderTopRightRadius:7},
  basket:{position:'absolute',bottom:1,width:20,height:13,borderWidth:1.8,borderRadius:4},
  basketLine:{position:'absolute',left:3,right:3,top:4,height:1.3,borderRadius:2},
  personHead:{position:'absolute',left:3,top:2,width:7,height:7,borderRadius:4},
  personBody:{position:'absolute',left:0,top:11,width:13,height:9,borderWidth:1.7,borderBottomWidth:0,borderTopLeftRadius:7,borderTopRightRadius:7},
  personHeadSmall:{position:'absolute',right:1,top:5,width:6,height:6,borderRadius:3},
  personBodySmall:{position:'absolute',right:-1,top:13,width:10,height:7,borderWidth:1.5,borderBottomWidth:0,borderTopLeftRadius:6,borderTopRightRadius:6},
});
