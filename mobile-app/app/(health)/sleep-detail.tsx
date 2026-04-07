import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { useSleepDetail, TimeRange } from '../../hooks/useSleepDetail';

// Sleep stage colors - soft purple palette
const SLEEP_COLORS = {
  deep: '#5B21B6',
  light: '#8B5CF6',
  rem: '#A78BFA',
  awake: '#E5E7EB',
};

export default function SleepDetailScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const { data: sleepData, loading, error } = useSleepDetail();

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return Colors.status.success;
    if (quality >= 60) return Colors.secondary.orange;
    return Colors.status.error;
  };

  const getQualityText = (quality: number) => {
    if (quality >= 80) return 'Tốt';
    if (quality >= 60) return 'Trung bình';
    if (quality > 0) return 'Kém';
    return 'Chưa có';
  };

  const renderSleepTimeline = () => {
    const stages = sleepData.day.stages;
    const totalMinutes = sleepData.day.duration * 60 || 1; // Total sleep time in minutes

    if (stages.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="moon-outline" size={40} color={Colors.neutral.placeholder} />
          <Text style={styles.noDataText}>Chưa có dữ liệu giấc ngủ</Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        <View style={styles.timelineBar}>
          {stages.map((stage, index) => {
            const stageColor = SLEEP_COLORS[stage.type as keyof typeof SLEEP_COLORS];
            // Calculate width based on duration
            const startMinutes = parseInt(stage.start.split(':')[0]) * 60 + parseInt(stage.start.split(':')[1]);
            const endMinutes = parseInt(stage.end.split(':')[0]) * 60 + parseInt(stage.end.split(':')[1]);
            let duration = endMinutes - startMinutes;
            if (duration < 0) duration += 24 * 60; // Handle midnight crossing
            const widthPercent = (duration / totalMinutes) * 100;

            return (
              <View
                key={index}
                style={[
                  styles.timelineSegment,
                  { flex: widthPercent, backgroundColor: stageColor },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.timelineLabels}>
          <Text style={styles.timelineLabel}>{sleepData.day.bedTime}</Text>
          <Text style={styles.timelineLabel}>{sleepData.day.wakeTime}</Text>
        </View>
      </View>
    );
  };

  const renderWeeklyChart = () => {
    const chartData = timeRange === 'week' ? sleepData.week.data : sleepData.month.data;
    const max = 9;
    const min = 5;
    const range = max - min;

    // For month view, sample every 5th day
    const displayData = timeRange === 'month'
      ? chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1)
      : chartData;

    return (
      <View style={styles.weeklyChartContainer}>
        {/* Target zone */}
        <View style={styles.targetZone}>
          <Text style={styles.targetZoneText}>Vùng lý tưởng: 7-9h</Text>
        </View>

        {/* Bars */}
        <View style={styles.chartBars}>
          {displayData.map((value, index) => {
            const barHeight = value > 0 ? ((value - min) / range) * 120 + 20 : 5;
            const isGood = value >= 7 && value <= 9;
            return (
              <View key={index} style={styles.chartBarWrapper}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: barHeight,
                      backgroundColor: isGood ? Colors.health.sleep : Colors.secondary.orange + '80',
                    },
                  ]}
                />
                <Text style={styles.chartBarValue}>{value}h</Text>
              </View>
            );
          })}
        </View>

        {/* Labels */}
        <View style={styles.chartLabels}>
          {(timeRange === 'week' ? sleepData.week.labels : sleepData.month.labels).map((label, index) => (
            <Text key={index} style={styles.chartLabel}>{label}</Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giấc ngủ</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.moonIcon, { backgroundColor: Colors.health.sleep + '20' }]}>
              <Ionicons name="moon" size={28} color={Colors.health.sleep} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Đêm qua</Text>
              <View style={styles.summaryValueRow}>
                <Text style={styles.summaryValue}>{sleepData.day.duration || '--'}</Text>
                <Text style={styles.summaryUnit}>giờ</Text>
              </View>
            </View>
            <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(sleepData.day.quality) + '20' }]}>
              <Text style={[styles.qualityValue, { color: getQualityColor(sleepData.day.quality) }]}>
                {sleepData.day.quality > 0 ? `${sleepData.day.quality}%` : '--'}
              </Text>
              <Text style={[styles.qualityText, { color: getQualityColor(sleepData.day.quality) }]}>
                {getQualityText(sleepData.day.quality)}
              </Text>
            </View>
          </View>

          <View style={styles.sleepTimeRow}>
            <View style={styles.sleepTimeItem}>
              <Ionicons name="bed-outline" size={18} color={Colors.neutral.textSecondary} />
              <View>
                <Text style={styles.sleepTimeLabel}>Đi ngủ</Text>
                <Text style={styles.sleepTimeValue}>{sleepData.day.bedTime}</Text>
              </View>
            </View>
            <View style={styles.sleepTimeDivider}>
              <Ionicons name="arrow-forward" size={16} color={Colors.neutral.placeholder} />
            </View>
            <View style={styles.sleepTimeItem}>
              <Ionicons name="sunny-outline" size={18} color={Colors.neutral.textSecondary} />
              <View>
                <Text style={styles.sleepTimeLabel}>Thức dậy</Text>
                <Text style={styles.sleepTimeValue}>{sleepData.day.wakeTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.deviceRow}>
            <Ionicons name="watch-outline" size={14} color={Colors.neutral.textSecondary} />
            <Text style={styles.deviceText}>{loading ? 'Đang tải...' : 'Cập nhật từ thiết bị'}</Text>
          </View>
        </View>

        {/* Sleep Stages Card */}
        <View style={styles.stagesCard}>
          <Text style={styles.sectionTitle}>Giai đoạn giấc ngủ</Text>

          {/* Timeline visualization */}
          {renderSleepTimeline()}

          {/* Stage breakdown */}
          <View style={styles.stagesGrid}>
            <View style={styles.stageItem}>
              <View style={[styles.stageDot, { backgroundColor: SLEEP_COLORS.deep }]} />
              <Text style={styles.stageName}>Ngủ sâu</Text>
              <Text style={styles.stageValue}>{sleepData.day.deepSleep || '--'}h</Text>
              <Text style={styles.stagePercent}>
                {sleepData.day.duration > 0 ? Math.round((sleepData.day.deepSleep / sleepData.day.duration) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.stageItem}>
              <View style={[styles.stageDot, { backgroundColor: SLEEP_COLORS.light }]} />
              <Text style={styles.stageName}>Ngủ nhẹ</Text>
              <Text style={styles.stageValue}>{sleepData.day.lightSleep || '--'}h</Text>
              <Text style={styles.stagePercent}>
                {sleepData.day.duration > 0 ? Math.round((sleepData.day.lightSleep / sleepData.day.duration) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.stageItem}>
              <View style={[styles.stageDot, { backgroundColor: SLEEP_COLORS.rem }]} />
              <Text style={styles.stageName}>REM</Text>
              <Text style={styles.stageValue}>{sleepData.day.remSleep || '--'}h</Text>
              <Text style={styles.stagePercent}>
                {sleepData.day.duration > 0 ? Math.round((sleepData.day.remSleep / sleepData.day.duration) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.stageItem}>
              <View style={[styles.stageDot, { backgroundColor: SLEEP_COLORS.awake }]} />
              <Text style={styles.stageName}>Thức</Text>
              <Text style={styles.stageValue}>{sleepData.day.awake || '--'}h</Text>
              <Text style={styles.stagePercent}>
                {sleepData.day.duration > 0 ? Math.round((sleepData.day.awake / sleepData.day.duration) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeCard}>
          {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === 'day' ? 'Đêm qua' : range === 'week' ? 'Tuần' : 'Tháng'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly/Monthly Chart */}
        {timeRange !== 'day' && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>
              Xu hướng giấc ngủ {timeRange === 'week' ? 'tuần này' : 'tháng này'}
            </Text>
            {renderWeeklyChart()}

            {/* Average stats */}
            <View style={styles.avgStatsRow}>
              <View style={styles.avgStat}>
                <Text style={styles.avgStatValue}>
                  {timeRange === 'week' ? sleepData.week.avgDuration : sleepData.month.avgDuration || '--'}h
                </Text>
                <Text style={styles.avgStatLabel}>TB/đêm</Text>
              </View>
              <View style={styles.avgStat}>
                <Text style={styles.avgStatValue}>
                  {timeRange === 'week' ? sleepData.week.avgQuality : sleepData.month.avgQuality || '--'}%
                </Text>
                <Text style={styles.avgStatLabel}>Chất lượng</Text>
              </View>
              <View style={styles.avgStat}>
                <Text style={styles.avgStatValue}>
                  {timeRange === 'week' ? sleepData.week.avgDeep : sleepData.month.avgDeep || '--'}h
                </Text>
                <Text style={styles.avgStatLabel}>Ngủ sâu</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sleep Score Breakdown */}
        <View style={styles.scoreCard}>
          <Text style={styles.sectionTitle}>Phân tích điểm</Text>
          {[
            { name: 'Thời lượng', score: 90, icon: 'time-outline' },
            { name: 'Ngủ sâu', score: 85, icon: 'moon-outline' },
            { name: 'Liên tục', score: 78, icon: 'refresh-outline' },
            { name: 'Hiệu quả', score: 88, icon: 'checkmark-circle-outline' },
          ].map((item, index) => (
            <View key={index} style={styles.scoreRow}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={Colors.health.sleep}
              />
              <Text style={styles.scoreName}>{item.name}</Text>
              <View style={styles.scoreBarContainer}>
                <View
                  style={[
                    styles.scoreBar,
                    { width: `${item.score}%` },
                  ]}
                />
              </View>
              <Text style={styles.scoreValue}>{item.score}</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIcon}>
            <Ionicons name="bulb" size={20} color={Colors.secondary.orange} />
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Gợi ý cải thiện</Text>
            <Text style={styles.tipsText}>
              Bạn đã ngủ đủ giấc! Để cải thiện hơn nữa, hãy thử đi ngủ sớm hơn 30 phút và tránh dùng điện thoại trước khi ngủ.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.neutral.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  summaryCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moonIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryValue: {
    fontSize: 40,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.neutral.textPrimary,
  },
  summaryUnit: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.neutral.textSecondary,
    marginLeft: 4,
  },
  qualityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  qualityValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  qualityText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  sleepTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  sleepTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sleepTimeLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.textSecondary,
  },
  sleepTimeValue: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.neutral.textPrimary,
  },
  sleepTimeDivider: {
    marginHorizontal: Spacing.xl,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  deviceText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
  },
  stagesCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.md,
  },
  timelineContainer: {
    marginBottom: Spacing.lg,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 2,
  },
  timelineSegment: {
    borderRadius: 12,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timelineLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.textSecondary,
  },
  stagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageItem: {
    alignItems: 'center',
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  stageName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.textSecondary,
  },
  stageValue: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  stagePercent: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.placeholder,
  },
  timeRangeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.health.sleep,
  },
  timeRangeText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.neutral.textSecondary,
  },
  timeRangeTextActive: {
    color: Colors.neutral.white,
  },
  chartCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  weeklyChartContainer: {
    marginBottom: Spacing.md,
  },
  targetZone: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  targetZoneText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.placeholder,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingVertical: Spacing.sm,
  },
  chartBarWrapper: {
    alignItems: 'center',
  },
  chartBar: {
    width: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  chartBarValue: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.textSecondary,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.placeholder,
  },
  avgStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  avgStat: {
    alignItems: 'center',
  },
  avgStatValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.health.sleep,
  },
  avgStatLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  scoreCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreName: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textPrimary,
    width: 80,
    marginLeft: Spacing.sm,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.border,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: Colors.health.sleep,
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.neutral.textPrimary,
    width: 30,
    textAlign: 'right',
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.status.warningLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  tipsIcon: {
    marginRight: Spacing.sm,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.secondary.orange,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
    lineHeight: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  noDataText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.neutral.textSecondary,
    marginTop: Spacing.sm,
  },
});
