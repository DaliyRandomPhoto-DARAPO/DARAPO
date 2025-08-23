import React, { memo } from 'react';
import { View, Text, TextStyle, ViewStyle, StyleSheet } from 'react-native';
import type { Mission } from '../types/mission';
import { theme } from './theme';

const baseColors = { ...theme.colors, primaryAlt: '#EC4899' } as const;

export default memo(function MissionInfo({
  mission,
  compact = false,
  inverted = false,
  center = false,
  showDescription = false,
}: {
  mission?: Mission | null;
  compact?: boolean;
  inverted?: boolean;
  center?: boolean;
  showDescription?: boolean;
}) {
  if (!mission) return null;
  const colors = inverted
    ? { text: '#FFFFFF', subText: '#FFFFFFAA', primaryAlt: '#FFD6E0' }
    : baseColors;

  const titleStyle = StyleSheet.flatten([
    styles.title,
    compact && styles.titleCompact,
    { color: colors.text, textAlign: center ? 'center' : 'left' },
  ]) as TextStyle;

  const subtitleStyle = StyleSheet.flatten([
    styles.subtitle,
    { color: colors.subText, textAlign: center ? 'center' : 'left' },
  ]) as TextStyle;

  const twistStyle = StyleSheet.flatten([
    styles.twist,
    { color: colors.primaryAlt, textAlign: center ? 'center' : 'left' },
  ]) as TextStyle;

  const tagsWrapStyle = StyleSheet.flatten([
    styles.tagsWrap,
    { justifyContent: center ? 'center' : 'flex-start' } as ViewStyle,
  ]) as ViewStyle;

  return (
    <View style={[styles.container, center ? styles.containerFull : undefined]}>
      <View style={[styles.titleRow, center ? styles.centerRow : undefined]}>
        <Text style={titleStyle}>{mission.title || '오늘의 미션'}</Text>
        {mission.isRare ? <Text style={styles.rare}>{compact ? '✨' : '✨ 희귀'}</Text> : null}
      </View>
      {(() => {
        // Show description only when explicitly allowed (Home). Otherwise show structured subtitle only.
        const desc = showDescription ? ((mission as any).description as string | undefined) : undefined;
        if (desc && desc.trim().length > 0) {
          const short = desc.length > 140 ? desc.slice(0, 140).trim() + '...' : desc;
          return <Text style={subtitleStyle}>{short}</Text>;
        }

        const subtitle = mission.subtitle;
        return subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null;
      })()}
      {!!mission.twist && <Text style={twistStyle}>힌트: {mission.twist}</Text>}
      {!!mission.tags?.length && (
        <View style={tagsWrapStyle}>
          {mission.tags.map((t) => (
            <View key={t} style={styles.tagChip}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: undefined },
  containerFull: { width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  centerRow: { justifyContent: 'center' },
  title: { fontWeight: '800' as TextStyle['fontWeight'], fontSize: 18 },
  titleCompact: { fontSize: 14 },
  subtitle: { marginTop: 6 },
  twist: { marginTop: 6, fontWeight: '700' as TextStyle['fontWeight'] },
  tagsWrap: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' as ViewStyle['flexWrap'] },
  tagChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginTop: 4 },
  tagText: { color: '#4F46E5', fontSize: 12 },
  rare: { color: '#F59E0B', marginLeft: 8 },
});
