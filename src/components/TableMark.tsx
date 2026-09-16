import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props={size?:number};

/**
 * Original, dependency-free brand motif: a shared table seen from above.
 * It is deliberately geometric so it remains consistent on iOS/Android and
 * avoids platform emoji or borrowed iconography.
 */
export function TableMark({size=96}:Props){
  const seat=Math.max(9,Math.round(size*.14));
  const ring=Math.round(size*.62);
  const inner=Math.round(size*.38);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.wrap,{width:size,height:size}]}> 
    <View style={[styles.halo,{width:size,height:size,borderRadius:size/2}]}/>
    <View style={[styles.table,{width:ring,height:ring,borderRadius:ring/2,left:(size-ring)/2,top:(size-ring)/2}]}/>
    <View style={[styles.plate,{width:inner,height:inner,borderRadius:inner/2,left:(size-inner)/2,top:(size-inner)/2}]}/>
    <View style={[styles.seat,styles.top,{width:seat,height:seat,borderRadius:seat/2,left:(size-seat)/2,top:2}]}/>
    <View style={[styles.seat,styles.right,{width:seat,height:seat,borderRadius:seat/2,right:2,top:(size-seat)/2}]}/>
    <View style={[styles.seat,styles.bottom,{width:seat,height:seat,borderRadius:seat/2,left:(size-seat)/2,bottom:2}]}/>
    <View style={[styles.seat,styles.left,{width:seat,height:seat,borderRadius:seat/2,left:2,top:(size-seat)/2}]}/>
  </View>;
}

const styles=StyleSheet.create({
  wrap:{position:'relative'},
  halo:{position:'absolute',backgroundColor:colors.sageSoft},
  table:{position:'absolute',backgroundColor:colors.sageDark},
  plate:{position:'absolute',backgroundColor:colors.cream,borderWidth:2,borderColor:colors.onAccentMuted},
  seat:{position:'absolute',backgroundColor:colors.orange},
  top:{},right:{},bottom:{},left:{},
});
