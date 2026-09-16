import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { TableMark } from './TableMark';

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  rtl?: boolean;
  compact?: boolean;
};

/**
 * Calm, reusable empty state. It uses Notre Table's original table motif
 * instead of decorative emoji or third-party artwork.
 */
export function EmptyState({ title, description, actionLabel, onAction, rtl=false, compact=false }: Props) {
  return <View style={[styles.card, compact && styles.compact]}>
    <TableMark size={compact ? 42 : 54}/>
    <View style={styles.copy}>
      <Text style={[styles.title, rtl && styles.rtl]}>{title}</Text>
      <Text style={[styles.description, rtl && styles.rtl]}>{description}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card:{
    backgroundColor:colors.paper,
    borderWidth:1,
    borderColor:colors.border,
    borderRadius:radius.md,
    padding:16,
    marginTop:18,
    flexDirection:'row',
    alignItems:'center',
    gap:14,
  },
  compact:{padding:13,marginTop:12},
  copy:{flex:1},
  title:{color:colors.ink,fontSize:14,fontWeight:'900'},
  description:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:4},
  action:{alignSelf:'flex-start',minHeight:36,borderRadius:11,backgroundColor:colors.sageSoft,paddingHorizontal:12,alignItems:'center',justifyContent:'center',marginTop:10},
  actionText:{color:colors.sageDark,fontSize:10,fontWeight:'900'},
  rtl:{textAlign:'right',writingDirection:'rtl'},
});
