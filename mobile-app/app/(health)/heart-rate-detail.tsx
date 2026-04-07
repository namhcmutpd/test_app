import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { useHeartRateDetail, TimeRange } from '../../hooks/useHeartRateDetail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;

export default function HeartRateDetailScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const { data: heartRateData, loading, error } = useHeartRateDetail();
  
  const currentData = heartRateData[timeRange];
  const measurements = heartRateData.measurements;

  const getHeartRateZone = (bpm: number) => {
    if (bpm < 60) return { zone: 'Thấp', color: Colors.secondary.teal, bg: '#CCFBF1' };
    if (bpm < 100) return { zone: 'Bình thường', color: Colors.status.success, bg: Colors.status.successLight };
    if (bpm < 140) return { zone: 'Cardio', color: Colors.secondary.orange, bg: Colors.status.warningLight };
    return { zone: 'Cao', color: Colors.status.error, bg: Colors.status.errorLight };
  };

  const currentZone = getHeartRateZone(currentData.current);

  const renderChart = () => {
    const maxVal = Math.max(...currentData.data) || 100;
    const minVal = Math.min(...currentData.data.filter(v => v > 0)) || 0;
    const range = maxVal - minVal || 1;
    const chartHeight = 150;

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxVal}</Text>
          <Text style={styles.yAxisLabel}>{Math.round((maxVal + minVal) / 2)}</Text>
          <Text style={styles.yAxisLabel}>{minVal}</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {currentData.data.map((value, index) => {
              const barHeight = value > 0 ? ((value - minVal) / range) * chartHeight + 10 : 5;
              const zone = getHeartRateZone(value);
              return (
                <View key={index} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: value > 0 ? zone.color + '80' : Colors.neutral.border,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderXAxisLabels = () => {
    const labels = timeRange === 'month'
      ? currentData.labels
      : currentData.labels.filter((_: string, i: number) => i % (timeRange === 'day' ? 2 : 1) === 0);

    return (
      <View style={[styles.xAxisLabels, { marginLeft: 35 }]}>
        {labels.map((label: string, index: number) => (
          <Text key={index} style={styles.xAxisLabel}>
            {label}
          </Text>
        ))}
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
        <Text style={styles.headerTitle}>Nhịp tim</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Value Card */}
        <View style={styles.currentValueCard}>
          <View style={styles.currentValueHeader}>
            <View style={[styles.heartIcon, { backgroundColor: Colors.health.heartRate + '20' }]}>
              <Ionicons name="heart" size={28} color={Colors.health.heartRate} />
            </View>
            <View style={styles.currentValueInfo}>
              <Text style={styles.currentLabel}>Hiện tại</Text>
              <View style={styles.currentValueRow}>
                <Text style={styles.currentValue}>{currentData.current || '--'}</Text>
                <Text style={styles.currentUnit}>BPM</Text>
              </View>
            </View>
            <View style={[styles.zoneBadge, { backgroundColor: currentZone.bg }]}>
              <Text style={[styles.zoneText, { color: currentZone.color }]}>
                {currentData.current > 0 ? currentZone.zone : 'Chưa có'}
              </Text>
            </View>
          </View>

          <View style={styles.deviceRow}>
            <Ionicons name="watch-outline" size={14} color={Colors.neutral.textSecondary} />
            <Text style={styles.deviceText}>
              {loading ? 'Đang tải...' : 'Cập nhật từ thiết bị'}
            </Text>
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
                {range === 'day' ? 'Ngày' : range === 'week' ? 'Tuần' : 'Tháng'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            Biểu đồ nhịp tim {timeRange === 'day' ? 'hôm nay' : timeRange === 'week' ? 'tuần này' : 'tháng này'}
          </Text>
          {renderChart()}
          {renderXAxisLabels()}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="arrow-down" size={20} color={Colors.secondary.teal} />
            <Text style={styles.statValue}>{currentData.min || '--'}</Text>
            <Text style={styles.statLabel}>Thấp nhất</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="analytics" size={20} color={Colors.primary.main} />
            <Text style={styles.statValue}>{currentData.avg || '--'}</Text>
            <Text style={styles.statLabel}>Trung bình</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="arrow-up" size={20} color={Colors.status.error} />
            <Text style={styles.statValue}>{currentData.max || '--'}</Text>
            <Text style={styles.statLabel}>Cao nhất</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bed" size={20} color={Colors.health.sleep} />
            <Text style={styles.statValue}>{currentData.resting || '--'}</Text>
            <Text style={styles.statLabel}>Nghỉ ngơi</Text>
          </View>
        </View>

        {/* Heart Rate Zones */}
        <View style={styles.zonesCard}>
          <Text style={styles.sectionTitle}>Vùng nhịp tim</Text>
          {[
            { zone: 'Thấp', range: '< 60 BPM', color: Colors.secondary.teal, percent: 15 },
            { zone: 'Bình thường', range: '60-100 BPM', color: Colors.status.success, percent: 65 },
            { zone: 'Cardio', range: '100-140 BPM', color: Colors.secondary.orange, percent: 15 },
            { zone: 'Cao', range: '> 140 BPM', color: Colors.status.error, percent: 5 },
          ].map((item, index) => (
            <View key={index} style={styles.zoneRow}>
              <View style={[styles.zoneDot, { backgroundColor: item.color }]} />
              <Text style={styles.zoneName}>{item.zone}</Text>
              <Text style={styles.zoneRange}>{item.range}</Text>
              <View style={styles.zoneBarContainer}>
                <View
                  style={[
                    styles.zoneBar,
                    { width: `${item.percent}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.zonePercent}>{item.percent}%</Text>
            </View>
          ))}
        </View>

        {/* Recent Measurements */}
        <View style={styles.measurementsCard}>
          <Text style={styles.sectionTitle}>Đo gần đây</Text>
          {measurements.length > 0 ? (
            measurements.map((item, index) => (
              <View key={index} style={[styles.measurementRow, index < measurements.length - 1 && styles.measurementBorder]}>
                <View style={styles.measurementLeft}>
                  <Text style={styles.measurementTime}>{item.time}</Text>
                  <Text style={styles.measurementActivity}>{item.activity}</Text>
                </View>
                <View style={styles.measurementRight}>
                  <Text style={[styles.measurementValue, { color: getHeartRateZone(item.value).color }]}>
                    {item.value} <Text style={styles.measurementUnit}>BPM</Text>
                  </Text>
                  <View style={styles.measurementDevice}>
                    <Ionicons name="watch-outline" size={10} color={Colors.neutral.placeholder} />
                    <Text style={styles.measurementDeviceText}>{item.device}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="pulse-outline" size={40} color={Colors.neutral.placeholder} />
              <Text style={styles.noDataText}>Chưa có dữ liệu đo</Text>
              <Text style={styles.noDataSubtext}>Kết nối thiết bị để bắt đầu theo dõi</Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIcon}>
            <Ionicons name="information-circle" size={20} color={Colors.primary.main} />
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Lời khuyên</Text>
            <Text style={styles.tipsText}>
              {currentData.resting > 0 
                ? `Nhịp tim nghỉ ngơi của bạn là ${currentData.resting} BPM, nằm trong vùng khỏe mạnh. Tiếp tục duy trì chế độ tập luyện đều đặn!`
                : 'Kết nối thiết bị theo dõi sức khỏe để nhận được những lời khuyên phù hợp với tình trạng sức khỏe của bạn.'}
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
  currentValueCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  currentValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  currentValueInfo: {
    flex: 1,
  },
  currentLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentValue: {
    fontSize: 40,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.neutral.textPrimary,
  },
  currentUnit: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.neutral.textSecondary,
    marginLeft: 4,
  },
  zoneBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  zoneText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    gap: Spacing.xs,
  },
  deviceText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
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
    backgroundColor: Colors.primary.main,
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
  chartTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 170,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  yAxisLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.placeholder,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.neutral.border,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: 3,
    minHeight: 4,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  xAxisLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.placeholder,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.neutral.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  zonesCard: {
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
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  zoneName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.neutral.textPrimary,
    width: 80,
  },
  zoneRange: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.textSecondary,
    width: 80,
  },
  zoneBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.border,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  zoneBar: {
    height: '100%',
    borderRadius: 4,
  },
  zonePercent: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.neutral.textPrimary,
    width: 35,
    textAlign: 'right',
  },
  measurementsCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  measurementBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  measurementLeft: {},
  measurementTime: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.neutral.textPrimary,
  },
  measurementActivity: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  measurementRight: {
    alignItems: 'flex-end',
  },
  measurementValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  measurementUnit: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.normal,
  },
  measurementDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  measurementDeviceText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neutral.placeholder,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.status.infoLight,
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
    color: Colors.primary.main,
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
  noDataSubtext: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neutral.placeholder,
    marginTop: Spacing.xs,
  },
});
