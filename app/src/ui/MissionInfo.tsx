import React, { memo } from "react";
import { View, Text, TextStyle, ViewStyle, StyleSheet } from "react-native";
import type { Mission } from "../types/mission";
import { theme } from "./theme";

const baseColors = { ...theme.colors, primaryAlt: "#EC4899" } as const;

export default memo(function MissionInfo({
  mission,
  compact = false,
  inverted = false,
  center = false,
  showDescription = false,
  hideMeta = false,
  titleSize,
}: {
  mission?: Mission | null;
  compact?: boolean;
  inverted?: boolean;
  center?: boolean;
  showDescription?: boolean;
  hideMeta?: boolean;
  titleSize?: number;
}) {
  if (!mission) return null;
  const colors = inverted
    ? { text: "#FFFFFF", subText: "#FFFFFFAA", primaryAlt: "#FFD6E0" }
    : baseColors;

  const titleStyle = StyleSheet.flatten([
    styles.title,
    compact && styles.titleCompact,
    { color: colors.text, textAlign: center ? 'center' : 'left' },
    typeof titleSize === 'number' ? { fontSize: titleSize } : null,
  ]) as TextStyle;

  const subtitleStyle = StyleSheet.flatten([
    styles.subtitle,
    { color: colors.subText, textAlign: center ? "center" : "left" },
  ]) as TextStyle;

  // hint/tags styles removed

  const processNewlines = (s?: string) => (s ? s.replace(/\\n/g, "\n") : s);

  return (
    <View style={[styles.container, center ? styles.containerFull : undefined]}>
      <View style={[styles.titleRow, center ? styles.centerRow : undefined]}>
        <Text style={titleStyle}>{mission.title || "오늘의 미션"}</Text>
        {/* rare badge removed */}
      </View>
      {(() => {
        // Show description only when explicitly allowed (Home). Otherwise show structured subtitle only.
        const desc = showDescription
          ? ((mission as any).description as string | undefined)
          : undefined;
        if (desc && desc.trim().length > 0) {
          const processed = processNewlines(desc) as string;
          const short =
            processed.length > 140
              ? processed.slice(0, 140).trim() + "..."
              : processed;
          return <Text style={subtitleStyle}>{short}</Text>;
        }

        const subtitleRaw = mission.subtitle;
        const subtitle = subtitleRaw ? processNewlines(subtitleRaw) : undefined;
        return subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null;
      })()}
      {/* hint/tags removed from UI */}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: undefined },
  containerFull: { width: "100%" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  centerRow: { justifyContent: "center" },
  title: { fontWeight: "800" as TextStyle["fontWeight"], fontSize: 18 },
  titleCompact: { fontSize: 14 },
  subtitle: { marginTop: 6 },
  // hint/tags/rare styles removed
});
