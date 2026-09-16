import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import type { MealType } from '../types';

export function MealGlyph({ type, size = 34, inverted = false }:{ type:MealType; size?:number; inverted?:boolean }){
  const stroke=inverted?colors.onAccent:colors.sageDark;
  const soft=inverted?'rgba(255,255,255,0.14)':colors.sageSoft;
  const warm=inverted?'rgba(255,255,255,0.18)':colors.orangeSoft;
  const scale=size/34;
  const px=(value:number)=>value*scale;

  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.wrap,{width:size,height:size,borderRadius:size/2,backgroundColor:type==='snack'?warm:soft}]}> 
    {type==='breakfast'?<>
      <View style={{width:px(13),height:px(9),borderWidth:px(1.7),borderColor:stroke,borderRadius:px(3),transform:[{translateX:px(-1)}]}}/>
      <View style={{position:'absolute',width:px(5),height:px(6),borderWidth:px(1.5),borderLeftWidth:0,borderColor:stroke,borderTopRightRadius:px(4),borderBottomRightRadius:px(4),right:px(7),top:px(12)}}/>
      <View style={{position:'absolute',width:px(16),height:px(1.7),borderRadius:px(1),backgroundColor:stroke,bottom:px(9)}}/>
    </>:null}
    {type==='lunch'?<>
      <View style={{width:px(16),height:px(16),borderWidth:px(1.7),borderColor:stroke,borderRadius:px(8)}}/>
      <View style={{position:'absolute',width:px(9),height:px(9),borderWidth:px(1.5),borderColor:stroke,borderRadius:px(5)}}/>
    </>:null}
    {type==='snack'?<>
      <View style={{width:px(13),height:px(13),borderRadius:px(7),borderWidth:px(1.7),borderColor:stroke,transform:[{translateY:px(2)}]}}/>
      <View style={{position:'absolute',width:px(6),height:px(3.5),borderTopLeftRadius:px(5),borderBottomRightRadius:px(5),borderWidth:px(1.4),borderColor:stroke,transform:[{rotate:'-28deg'}],top:px(8),right:px(8)}}/>
    </>:null}
    {type==='dinner'?<>
      <View style={{width:px(17),height:px(17),borderWidth:px(1.7),borderColor:stroke,borderRadius:px(9)}}/>
      <View style={{position:'absolute',width:px(3),height:px(3),borderRadius:px(2),backgroundColor:stroke,top:px(11),left:px(11)}}/>
      <View style={{position:'absolute',width:px(7),height:px(1.5),borderRadius:px(1),backgroundColor:stroke,top:px(10),right:px(7),transform:[{rotate:'-38deg'}]}}/>
    </>:null}
  </View>;
}

const styles=StyleSheet.create({
  wrap:{alignItems:'center',justifyContent:'center',position:'relative',flexShrink:0},
});
